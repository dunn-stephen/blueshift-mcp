import axios, { AxiosInstance, AxiosError } from 'axios';
import { Logger } from './utils/logger';

export interface BlueshiftConfig {
  userApiKey: string;
  eventApiKey: string;
  region?: 'us' | 'eu';
}

export class BlueshiftClient {
  private userApiClient: AxiosInstance;
  private eventApiClient: AxiosInstance;
  private config: BlueshiftConfig;
  private baseURL: string;

  constructor(config: BlueshiftConfig) {
    this.config = config;
    
    // Set base URL based on region
    this.baseURL = config.region === 'eu' 
      ? 'https://api.eu.getblueshift.com/api'
      : 'https://api.getblueshift.com/api';

    // Create client for User API Key operations
    this.userApiClient = this.createAxiosInstance(config.userApiKey);
    
    // Create client for Event API Key operations
    this.eventApiClient = this.createAxiosInstance(config.eventApiKey);
  }

  private createAxiosInstance(apiKey: string): AxiosInstance {
    return axios.create({
      baseURL: this.baseURL,
      auth: {
        username: apiKey,
        password: ''
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000,
      validateStatus: (status) => status < 500
    });
  }

  private async handleRequest<T>(
    client: AxiosInstance,
    method: string,
    path: string,
    data?: any,
    params?: any
  ): Promise<T> {
    try {
      const response = await client.request({
        method,
        url: path,
        data,
        params
      });

      // Handle Blueshift API errors
      if (response.status >= 400) {
        throw this.handleApiError(response.data, response.status);
      }

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw this.handleAxiosError(error);
      }
      throw error;
    }
  }

  private handleApiError(data: any, status: number): Error {
    // Try to extract error message from various possible response formats
    const errorMessage = data?.error || 
                        data?.message || 
                        data?.error_message ||
                        data?.errors?.join(', ') ||
                        JSON.stringify(data) || 
                        'Unknown error';
    const errorCode = data?.code || data?.error_code || status.toString();

    switch (status) {
      case 400:
        return new Error(`Bad Request (${errorCode}): ${errorMessage}`);
      case 401:
        return new Error(`Authentication failed. Please check your API key.`);
      case 403:
        return new Error(`Forbidden: ${errorMessage}`);
      case 404:
        return new Error(`Not found: ${errorMessage}`);
      case 429:
        return new Error(`Rate limit exceeded. Please try again later.`);
      default:
        return new Error(`API Error (${errorCode}): ${errorMessage}`);
    }
  }

  private handleAxiosError(error: AxiosError): Error {
    if (error.code === 'ECONNREFUSED') {
      return new Error('Connection refused. Please check your internet connection.');
    }
    if (error.code === 'ETIMEDOUT') {
      return new Error('Request timed out. Please try again.');
    }
    return new Error(error.message);
  }

  // ===== CAMPAIGN MANAGEMENT (User API Key) =====
  
  async createCampaign(campaignType: string, data: any) {
    return this.handleRequest(
      this.userApiClient,
      'POST',
      `/v1/campaigns/${campaignType}`,
      data
    );
  }

  async executeCampaign(data: any) {
    return this.handleRequest(
      this.userApiClient,
      'POST',
      '/v1/campaigns/execute',
      data
    );
  }

  async bulkExecuteCampaigns(payloads: Array<{
    email: string;
    campaign_uuid: string;
    email_attachments?: string[];
  }>) {
    return this.handleRequest(
      this.userApiClient,
      'POST',
      '/v1/campaigns/bulk_execute',
      { payloads }
    );
  }

  async getCampaignsSummary(params?: any) {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      '/v1/campaigns.json',
      undefined,
      params
    );
  }

  async getCampaignDetail(campaignUuid: string) {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      `/v1/campaigns/${campaignUuid}.json`
    );
  }

  async getCampaignDetailWithStats(campaignUuid: string, startTime: string, endTime: string) {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      `/v1/campaigns/${campaignUuid}/detail.json`,
      undefined,
      { 
        start_time: startTime,
        end_time: endTime
      }
    );
  }

  async listCampaigns(params?: any) {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      '/v2/campaigns.json',
      undefined,
      params
    );
  }

  async launchCampaign(campaignUuid: string) {
    return this.handleRequest(
      this.userApiClient,
      'PATCH',
      `/v1/campaigns/${campaignUuid}/launch`
    );
  }

  async pauseCampaign(campaignUuid: string) {
    return this.handleRequest(
      this.userApiClient,
      'PATCH',
      `/v1/campaigns/${campaignUuid}/pause`
    );
  }

  async archiveCampaign(campaignUuid: string) {
    return this.handleRequest(
      this.userApiClient,
      'PUT',
      `/v1/campaigns/${campaignUuid}/archive`
    );
  }

  async unarchiveCampaign(campaignUuid: string) {
    return this.handleRequest(
      this.userApiClient,
      'PUT',
      `/v1/campaigns/${campaignUuid}/unarchive`
    );
  }

  async bulkArchiveCampaigns(campaignUuids: string[]) {
    return this.handleRequest(
      this.userApiClient,
      'PUT',
      '/v1/campaigns/bulk_archive',
      { uuid: campaignUuids }
    );
  }

  async bulkUnarchiveCampaigns(campaignUuids: string[]) {
    return this.handleRequest(
      this.userApiClient,
      'PUT',
      '/v1/campaigns/bulk_unarchive',
      { uuid: campaignUuids }
    );
  }

  async updateCampaignSchedule(campaignUuid: string, scheduleData: any) {
    return this.handleRequest(
      this.userApiClient,
      'PATCH',
      `/v1/campaigns/${campaignUuid}/update_schedule`,
      scheduleData
    );
  }

  async getCampaignPerformanceSummary(campaignUuid: string, params?: any) {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      `/v1/campaigns/${campaignUuid}/performance_summary`,
      undefined,
      params
    );
  }

  // ===== CUSTOMER MANAGEMENT (User API Key) =====
  
  async searchCustomer(email: string) {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      '/v1/customers',
      undefined,
      { email }
    );
  }

  async createOrUpdateCustomer(data: any) {
    return this.handleRequest(
      this.userApiClient,
      'POST',
      '/v1/customers',
      data
    );
  }

  async getCustomer(uuid: string) {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      `/v1/customers/${uuid}`
    );
  }

  async bulkCreateOrUpdateCustomers(customers: any[]) {
    return this.handleRequest(
      this.userApiClient,
      'POST',
      '/v1/customers/bulk',
      { customers }
    );
  }

  async forgetCustomer(data: any) {
    const requestData: any = {};
    
    // Add any provided identifiers
    if (data.email) requestData.email = data.email;
    if (data.customer_id) requestData.customer_id = data.customer_id;
    if (data.cookie) requestData.cookie = data.cookie;
    if (data.device_id) requestData.device_id = data.device_id;
    
    return this.handleRequest(
      this.userApiClient,
      'POST',
      '/v1/customers/forget',
      requestData
    );
  }

  async unforgetCustomer(data: any) {
    const requestData: any = {};
    
    // Add any provided identifiers
    if (data.email) requestData.email = data.email;
    if (data.customer_id) requestData.customer_id = data.customer_id;
    if (data.cookie) requestData.cookie = data.cookie;
    if (data.device_id) requestData.device_id = data.device_id;
    
    return this.handleRequest(
      this.userApiClient,
      'POST',
      '/v1/customers/unforget',
      requestData
    );
  }

  async deleteCustomer(data: any) {
    const requestData: any = {};
    
    // Add body parameters
    if (data.email) requestData.email = data.email;
    if (data.customer_id) requestData.customer_id = data.customer_id;
    
    // Add query parameters
    const params: any = {};
    if (data.delete_all_matching_customers !== undefined) {
      params.delete_all_matching_customers = data.delete_all_matching_customers;
    }
    
    return this.handleRequest(
      this.userApiClient,
      'POST',
      '/v1/customers/delete',
      requestData,
      params
    );
  }

  async mergeCustomers(customerId: string, newCustomerId: string) {
    return this.handleRequest(
      this.userApiClient,
      'POST',
      '/v1/customers/merge',
      {
        customer_id: customerId,
        bsft_new_customer_id: newCustomerId
      }
    );
  }

  // ===== EVENT TRACKING (Event API Key) =====
  
  async sendEvent(data: any) {
    return this.handleRequest(
      this.eventApiClient,
      'POST',
      '/v1/event',
      data
    );
  }

  async sendBulkEvents(events: any[]) {
    return this.handleRequest(
      this.eventApiClient,
      'POST',
      '/v1/bulkevents',
      { events }
    );
  }

  // ===== EVENT DEBUGGING (User API Key) =====
  
  async getRecentEvent() {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      '/v1/event/debug'
    );
  }

  async getEventSummary(params?: any) {
    return this.handleRequest(
      this.userApiClient,
      'POST',
      '/v1/event/summary.json',
      params
    );
  }

  async debugEventExports(dataConnectorUuid: string) {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      `/v1/data_connectors/${dataConnectorUuid}/debug`
    );
  }

  // ===== CATALOG MANAGEMENT (User API Key) =====
  
  async createCatalog(data: any) {
    return this.handleRequest(
      this.userApiClient,
      'POST',
      '/v1/catalogs',
      data
    );
  }

  async listCatalogs() {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      '/v1/catalogs'
    );
  }

  async addItemsToCatalog(catalogUuid: string, catalogData: any, syncUpdateWithProductData?: string) {
    let url = `/v1/catalogs/${catalogUuid}.json`;
    if (syncUpdateWithProductData) {
      url += `?syncUpdateWithProductData=${syncUpdateWithProductData}`;
    }
    
    return this.handleRequest(
      this.userApiClient,
      'PUT',
      url,
      catalogData
    );
  }

  async getCatalogDetails(catalogUuid: string) {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      `/v1/catalogs/${catalogUuid}.json`
    );
  }

  // ===== SEGMENTS (User API Key) =====
  
  async listSegments(params?: any) {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      '/v1/segments/list',
      undefined,
      params
    );
  }

  async getSegmentUsers(segmentUuid: string, params?: any) {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      `/v1/segments/${segmentUuid}/matching_users.json`,
      undefined,
      params
    );
  }

  // ===== TEMPLATES (User API Key) =====
  
  // Email Templates
  async listEmailTemplates(params?: any) {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      '/v1/email_templates.json',
      undefined,
      params
    );
  }

  async createEmailTemplate(data: any) {
    return this.handleRequest(
      this.userApiClient,
      'POST',
      '/v1/email_templates.json',
      data
    );
  }

  async getEmailTemplate(templateUuid: string) {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      `/v1/email_templates/${templateUuid}.json`
    );
  }

  async updateEmailTemplate(templateUuid: string, data: any) {
    return this.handleRequest(
      this.userApiClient,
      'PUT',
      `/v1/email_templates/${templateUuid}.json`,
      data
    );
  }

  async sendTestEmail(data: any) {
    return this.handleRequest(
      this.userApiClient,
      'POST',
      '/v1/email_templates/test_send.json',
      data
    );
  }

  // SMS Templates
  async listSmsTemplates(params?: any) {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      '/v1/sms_templates.json',
      undefined,
      params
    );
  }

  async createSmsTemplate(data: any) {
    return this.handleRequest(
      this.userApiClient,
      'POST',
      '/v1/sms_templates.json',
      data
    );
  }

  async updateSmsTemplate(templateUuid: string, data: any) {
    return this.handleRequest(
      this.userApiClient,
      'PUT',
      `/v1/sms_templates/${templateUuid}`,
      data
    );
  }

  async sendTestSms(data: any) {
    return this.handleRequest(
      this.userApiClient,
      'POST',
      '/v1/sms_templates/test_send.json',
      data
    );
  }

  // Push Templates
  async listPushTemplates(params?: any) {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      '/v1/push_templates.json',
      undefined,
      params
    );
  }

  async createPushTemplate(data: any) {
    return this.handleRequest(
      this.userApiClient,
      'POST',
      '/v1/push_templates.json',
      data
    );
  }

  async updatePushTemplate(templateUuid: string, data: any) {
    return this.handleRequest(
      this.userApiClient,
      'PUT',
      `/v1/push_templates/${templateUuid}`,
      data
    );
  }

  async sendTestPush(data: any) {
    return this.handleRequest(
      this.userApiClient,
      'POST',
      '/v1/push_templates/test_push.json',
      data
    );
  }

  // ===== CUSTOM USER LISTS (User API Key) =====
  
  async createUserList(data: any) {
    return this.handleRequest(
      this.userApiClient,
      'POST',
      '/v1/custom_user_lists/create',
      data
    );
  }

  async addUserToList(listId: string, data: any) {
    return this.handleRequest(
      this.userApiClient,
      'PUT',
      `/v1/custom_user_lists/add_user_to_list/${listId}`,
      data
    );
  }

  async removeUserFromList(listId: string, data: any) {
    return this.handleRequest(
      this.userApiClient,
      'PUT',
      `/v1/custom_user_lists/remove_user_from_list/${listId}`,
      data
    );
  }

  async bulkRemoveUsersFromList(listId: string, identifierKey: string, identifierValues: string[]) {
    return this.handleRequest(
      this.userApiClient,
      'PUT',
      `/v1/custom_user_lists/bulk_remove_users_from_list/${listId}`,
      { 
        identifier_key: identifierKey,
        identifier_values: identifierValues
      }
    );
  }

  async bulkAddUsersToList(listId: string, identifierKey: string, identifierValues: string[]) {
    return this.handleRequest(
      this.userApiClient,
      'PUT',
      `/v1/custom_user_lists/bulk_add_users_to_list/${listId}`,
      { 
        identifier_key: identifierKey,
        identifier_values: identifierValues
      }
    );
  }

  async getSeedLists() {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      '/v1/custom_user_lists/seed_lists'
    );
  }

  async getUserList(customUserListId: string) {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      `/v1/custom_user_lists/id/${customUserListId}`
    );
  }

  async overwriteUsersInList(listId: string, s3FilePath: string) {
    return this.handleRequest(
      this.userApiClient,
      'PUT',
      `/v1/custom_user_lists/overwrite_list/${listId}`,
      { s3_file_path: s3FilePath }
    );
  }

  // ===== LIVE CONTENT (Event API Key) =====
  
  async getLiveContent(data: any) {
    // If api_key is provided in data, use it; otherwise use the Event API key
    const requestData = {
      ...data,
      api_key: data.api_key || this.config.eventApiKey
    };
    
    // Remove the site parameter as it's not needed for this endpoint
    delete requestData.site;
    
    return this.handleRequest(
      this.eventApiClient,
      'POST',
      '/live',
      requestData
    );
  }

  async listLiveContentSlots(params?: any) {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      '/v1/onsite_slots.json',
      undefined,
      params
    );
  }

  // ===== INTEREST ALERTS (User API Key) =====

  async getCustomerSubscriptions(params: any) {
    const queryParams: any = {};
    
    // Add any provided identifiers
    if (params.email) queryParams.email = params.email;
    if (params.uuid) queryParams.uuid = params.uuid;
    if (params.customer_id) queryParams.customer_id = params.customer_id;
    if (params.phone_number) queryParams.phone_number = params.phone_number;
    if (params.device_id) queryParams.device_id = params.device_id;
    
    return this.handleRequest(
      this.userApiClient,
      'GET',
      '/v1/interests/user_subscriptions',
      undefined,
      queryParams
    );
  }

  async subscribeToTopic(data: any) {
    return this.handleRequest(
      this.userApiClient,
      'POST',
      '/v1/interest_alerts/subscribe',
      data
    );
  }

  async unsubscribeFromTopic(data: any) {
    return this.handleRequest(
      this.userApiClient,
      'POST',
      '/v1/interest_alerts/unsubscribe',
      data
    );
  }

  async updateOrAlertCustomers(data: any) {
    return this.handleRequest(
      this.userApiClient,
      'POST',
      '/v1/interests/alert',
      data
    );
  }

  // ===== EXTERNAL FETCH (User API Key) =====

  async listExternalFetchTemplates(params?: any) {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      '/v1/external_fetches.json',
      undefined,
      params
    );
  }

  async createExternalFetchTemplate(data: any) {
    return this.handleRequest(
      this.userApiClient,
      'POST',
      '/v1/external_fetches.json',
      data
    );
  }

  async updateExternalFetchTemplate(templateUuid: string, data: any) {
    return this.handleRequest(
      this.userApiClient,
      'PUT',
      `/v1/external_fetches/${templateUuid}`,
      data
    );
  }

  // ===== EMAIL VALIDATION (User API Key) =====

  async validateEmail(email: string) {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      '/v1/emails/validate',
      undefined,
      { email }
    );
  }

  async validateMultipleEmails(emails: string[]) {
    return this.handleRequest(
      this.userApiClient,
      'POST',
      '/v1/emails/bulk_validate',
      { emails }
    );
  }

  // ===== PROMOTIONS (User API Key) =====

  async addPromoCodesToPromotion(promotionUuid: string, promoCodes: string[]) {
    return this.handleRequest(
      this.userApiClient,
      'PUT',
      `/v1/promotions/${promotionUuid}/add_promocodes`,
      { promocodes: promoCodes }
    );
  }

  async overwritePromoCodesInPromotion(promotionUuid: string, promoCodes: string[]) {
    return this.handleRequest(
      this.userApiClient,
      'PUT',
      `/v1/promotions/${promotionUuid}/overwrite`,
      { promocodes: promoCodes }
    );
  }

  // ===== OTHER ENDPOINTS (User API Key) =====
  
  async listAdapters(params: { channel_name: string; adapter_name?: string }) {
    const queryParams = new URLSearchParams();
    queryParams.append('channel_name', params.channel_name);
    if (params.adapter_name) {
      queryParams.append('adapter_name', params.adapter_name);
    }
    
    return this.handleRequest(
      this.userApiClient,
      'GET',
      `/v1/account_adapters?${queryParams.toString()}`
    );
  }

  async listTags(params?: any) {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      '/v1/tag_contexts/list',
      undefined,
      params
    );
  }

  async getCustomerEvents(params: any) {
    return this.handleRequest(
      this.userApiClient,
      'GET',
      '/v1/customer_search/show_events',
      undefined,
      params
    );
  }
}