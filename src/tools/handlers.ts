import { AccountManager } from '../account-manager';
import { Logger } from '../utils/logger';

export async function handleToolExecution(
  accountManager: AccountManager,
  toolName: string,
  args: any
): Promise<any> {
  Logger.info(`Executing tool: ${toolName}`, { site: args.site || 'default' });
  
  // Special case for listing accounts
  if (toolName === 'blueshift_list_accounts') {
    const accounts = accountManager.getAccountList();
    return {
      accounts,
      total: accounts.length,
      defaultAccount: accountManager.getDefaultAccount()
    };
  }
  
  // Get the appropriate client
  const client = accountManager.getClient(args.site);
  
  // Remove site from args before passing to API
  const { site, ...apiArgs } = args;
  
  // Route to appropriate API method
  switch (toolName) {
    // ===== CAMPAIGNS =====
    case 'blueshift_execute_campaign':
      return await client.executeCampaign({
        campaign_uuid: apiArgs.campaign_uuid,
        email: apiArgs.email,
        customer_id: apiArgs.customer_id,
        ...apiArgs.trigger_attributes
      });
      
    case 'blueshift_bulk_execute_campaigns':
      return await client.bulkExecuteCampaigns(apiArgs.payloads);
      
    case 'blueshift_list_campaigns':
      return await client.listCampaigns(apiArgs);
      
    case 'blueshift_get_campaign_detail':
      return await client.getCampaignDetail(apiArgs.campaign_uuid);
      
    case 'blueshift_get_campaign_detail_with_stats':
      return await client.getCampaignDetailWithStats(
        apiArgs.campaign_uuid,
        apiArgs.start_time,
        apiArgs.end_time
      );
      
    case 'blueshift_get_campaigns_performance_summary':
      return await client.getCampaignsSummary(apiArgs);
      
    case 'blueshift_create_campaign':
      return await client.createCampaign(
        apiArgs.campaign_type,
        apiArgs
      );
      
    case 'blueshift_launch_campaign':
      return await client.launchCampaign(apiArgs.campaign_uuid);
      
    case 'blueshift_pause_campaign':
      return await client.pauseCampaign(apiArgs.campaign_uuid);
      
    case 'blueshift_archive_campaign':
      return await client.archiveCampaign(apiArgs.campaign_uuid);
      
    case 'blueshift_unarchive_campaign':
      return await client.unarchiveCampaign(apiArgs.campaign_uuid);
      
    case 'blueshift_bulk_archive_campaigns':
      return await client.bulkArchiveCampaigns(apiArgs.campaign_uuids);
      
    case 'blueshift_bulk_unarchive_campaigns':
      return await client.bulkUnarchiveCampaigns(apiArgs.campaign_uuids);
      
    case 'blueshift_update_campaign_schedule':
      const scheduleData: any = {
        startdate: apiArgs.startdate
      };
      if (apiArgs.enddate) scheduleData.enddate = apiArgs.enddate;
      if (apiArgs.recurring_schedule) scheduleData.recurring_schedule = apiArgs.recurring_schedule;
      if (apiArgs.repeating_schedule_attributes) {
        scheduleData.repeating_schedule_attributes = apiArgs.repeating_schedule_attributes;
      }
      
      return await client.updateCampaignSchedule(
        apiArgs.campaign_uuid,
        scheduleData
      );
      
    case 'blueshift_get_campaign_performance':
      return await client.getCampaignPerformanceSummary(
        apiArgs.campaign_uuid,
        apiArgs
      );
    
    // ===== CUSTOMERS =====
    case 'blueshift_create_update_customer':
      return await client.createOrUpdateCustomer(apiArgs);
      
    case 'blueshift_search_customer':
      return await client.searchCustomer(apiArgs.email);
      
    case 'blueshift_get_customer':
      return await client.getCustomer(apiArgs.uuid);
      
    case 'blueshift_bulk_update_customers':
      return await client.bulkCreateOrUpdateCustomers(apiArgs.customers);
      
    case 'blueshift_delete_customer':
      return await client.deleteCustomer(apiArgs);
      
    case 'blueshift_forget_customer':
      return await client.forgetCustomer(apiArgs);
      
    case 'blueshift_unforget_customer':
      return await client.unforgetCustomer(apiArgs);
      
    case 'blueshift_merge_customers':
      return await client.mergeCustomers(
        apiArgs.customer_id,
        apiArgs.bsft_new_customer_id
      );
    
    // ===== EVENTS =====
    case 'blueshift_publish_event':
      const eventData: any = {
        event: apiArgs.event
      };
      
      // Add all optional fields if provided
      if (apiArgs.email) eventData.email = apiArgs.email;
      if (apiArgs.customer_id) eventData.customer_id = apiArgs.customer_id;
      if (apiArgs.device_id) eventData.device_id = apiArgs.device_id;
      if (apiArgs.cookie) eventData.cookie = apiArgs.cookie;
      if (apiArgs.device_type) eventData.device_type = apiArgs.device_type;
      if (apiArgs.device_token) eventData.device_token = apiArgs.device_token;
      if (apiArgs.device_idfa) eventData.device_idfa = apiArgs.device_idfa;
      if (apiArgs.device_idfv) eventData.device_idfv = apiArgs.device_idfv;
      if (apiArgs.device_manufacturer) eventData.device_manufacturer = apiArgs.device_manufacturer;
      if (apiArgs.os_name) eventData.os_name = apiArgs.os_name;
      if (apiArgs.network_carrier) eventData.network_carrier = apiArgs.network_carrier;
      if (apiArgs.ip) eventData.ip = apiArgs.ip;
      if (apiArgs.latitude) eventData.latitude = apiArgs.latitude;
      if (apiArgs.longitude) eventData.longitude = apiArgs.longitude;
      if (apiArgs.event_uuid) eventData.event_uuid = apiArgs.event_uuid;
      if (apiArgs.timestamp) eventData.timestamp = apiArgs.timestamp;
      
      // Merge any additional properties
      if (apiArgs.properties) {
        Object.assign(eventData, apiArgs.properties);
      }
      
      return await client.sendEvent(eventData);
      
    case 'blueshift_publish_bulk_events':
      return await client.sendBulkEvents(apiArgs.events);
      
    case 'blueshift_get_recent_event':
      return await client.getRecentEvent();
      
    case 'blueshift_get_event_summary':
      return await client.getEventSummary(apiArgs);
      
    case 'blueshift_debug_event_exports':
      return await client.debugEventExports(apiArgs.data_connector_uuid);
    
    // ===== CATALOGS =====
    case 'blueshift_create_catalog':
      return await client.createCatalog(apiArgs);
      
    case 'blueshift_list_catalogs':
      return await client.listCatalogs();
      
    case 'blueshift_add_catalog_items':
      return await client.addItemsToCatalog(
        apiArgs.catalog_uuid,
        apiArgs.catalog,
        apiArgs.syncUpdateWithProductData
      );
      
    case 'blueshift_get_catalog_details':
      return await client.getCatalogDetails(apiArgs.catalog_uuid);
    
    // ===== SEGMENTS =====
    case 'blueshift_list_segments':
      return await client.listSegments(apiArgs);
      
    case 'blueshift_get_segment_users':
      const segmentParams: any = {};
      if (apiArgs.refresh !== undefined) segmentParams.refresh = apiArgs.refresh;
      if (apiArgs.channels) segmentParams.channels = apiArgs.channels;
      if (apiArgs.bypass_global !== undefined) segmentParams.bypass_global = apiArgs.bypass_global;
      
      return await client.getSegmentUsers(apiArgs.segment_uuid, segmentParams);
    
    // ===== EMAIL TEMPLATES =====
    case 'blueshift_list_email_templates':
      return await client.listEmailTemplates(apiArgs);
      
    case 'blueshift_create_email_template':
      return await client.createEmailTemplate(apiArgs);
      
    case 'blueshift_get_email_template':
      return await client.getEmailTemplate(apiArgs.template_uuid);
      
    case 'blueshift_update_email_template':
      const updateTemplateData: any = {};
      
      // Add resource object if any resource fields are provided
      if (apiArgs.resource) {
        updateTemplateData.resource = apiArgs.resource;
      }
      
      // Add other fields if provided
      if (apiArgs.template_properties !== undefined) {
        updateTemplateData.template_properties = apiArgs.template_properties;
      }
      if (apiArgs.account_algorithm_uuid !== undefined) {
        updateTemplateData.account_algorithm_uuid = apiArgs.account_algorithm_uuid;
      }
      if (apiArgs.external_fetches !== undefined) {
        updateTemplateData.external_fetches = apiArgs.external_fetches;
      }
      if (apiArgs.transaction_mixins !== undefined) {
        updateTemplateData.transaction_mixins = apiArgs.transaction_mixins;
      }
      
      return await client.updateEmailTemplate(
        apiArgs.template_uuid,
        updateTemplateData
      );
      
    case 'blueshift_send_test_email':
      const testEmailData: any = {
        id: apiArgs.id,
        personalize_for: apiArgs.personalize_for
      };
      
      // Add optional fields if provided
      if (apiArgs.recipients) testEmailData.recipients = apiArgs.recipients;
      if (apiArgs.from_name) testEmailData.from_name = apiArgs.from_name;
      if (apiArgs.from_address) testEmailData.from_address = apiArgs.from_address;
      if (apiArgs.reply_to_address) testEmailData.reply_to_address = apiArgs.reply_to_address;
      
      return await client.sendTestEmail(testEmailData);
    
    // ===== SMS TEMPLATES =====
    case 'blueshift_list_sms_templates':
      return await client.listSmsTemplates(apiArgs);
      
    case 'blueshift_create_sms_template':
      return await client.createSmsTemplate(apiArgs);
      
    case 'blueshift_update_sms_template':
      return await client.updateSmsTemplate(
        apiArgs.template_uuid,
        apiArgs.template
      );
      
    case 'blueshift_send_test_sms':
      return await client.sendTestSms({
        uuid: apiArgs.uuid,
        mobile: apiArgs.mobile,
        personalize_for: apiArgs.personalize_for
      });
    
    // ===== PUSH TEMPLATES =====
    case 'blueshift_list_push_templates':
      return await client.listPushTemplates(apiArgs);
      
    case 'blueshift_create_push_template':
      return await client.createPushTemplate(apiArgs);
      
    case 'blueshift_update_push_template':
      // Pass the push_template object if provided, otherwise pass all apiArgs
      const updateData = apiArgs.push_template || apiArgs;
      return await client.updatePushTemplate(
        apiArgs.template_uuid,
        updateData
      );
      
    case 'blueshift_send_test_push':
      const testPushData: any = {
        uuid: apiArgs.uuid,
        personalize_for: apiArgs.personalize_for
      };
      
      // Add optional email field if provided
      if (apiArgs.email) {
        testPushData.email = apiArgs.email;
      }
      
      return await client.sendTestPush(testPushData);
    
    // ===== USER LISTS =====
    case 'blueshift_create_user_list':
      return await client.createUserList(apiArgs);
      
    case 'blueshift_add_to_user_list':
      return await client.addUserToList(apiArgs.list_id, {
        identifier_key: apiArgs.identifier_key,
        identifier_value: apiArgs.identifier_value
      });
      
    case 'blueshift_bulk_add_to_user_list':
      return await client.bulkAddUsersToList(
        apiArgs.list_id,
        apiArgs.identifier_key,
        apiArgs.identifier_values
      );
      
    case 'blueshift_remove_from_user_list':
      return await client.removeUserFromList(apiArgs.list_id, {
        identifier_key: apiArgs.identifier_key,
        identifier_value: apiArgs.identifier_value
      });
      
    case 'blueshift_bulk_remove_from_user_list':
      return await client.bulkRemoveUsersFromList(
        apiArgs.list_id,
        apiArgs.identifier_key,
        apiArgs.identifier_values
      );
      
    case 'blueshift_get_user_list':
      return await client.getUserList(apiArgs.custom_user_list_id);
      
    case 'blueshift_get_seed_lists':
      return await client.getSeedLists();
      
    case 'blueshift_overwrite_users_in_list':
      return await client.overwriteUsersInList(apiArgs.list_id, apiArgs.s3_file_path);
    
    // ===== LIVE CONTENT =====
    case 'blueshift_get_live_content':
      return await client.getLiveContent(apiArgs);
      
    case 'blueshift_list_live_content_slots':
      return await client.listLiveContentSlots(apiArgs);
    
    // ===== INTEREST ALERTS =====
    case 'blueshift_get_customer_subscriptions':
      return await client.getCustomerSubscriptions(apiArgs);
      
    case 'blueshift_subscribe_to_topic':
      return await client.subscribeToTopic({
        email: apiArgs.email,
        customer_id: apiArgs.customer_id,
        topic: apiArgs.topic,
        alert_type: apiArgs.alert_type,
        frequency: apiArgs.frequency,
        metadata: apiArgs.metadata
      });
      
    case 'blueshift_unsubscribe_from_topic':
      return await client.unsubscribeFromTopic({
        email: apiArgs.email,
        customer_id: apiArgs.customer_id,
        topic: apiArgs.topic,
        alert_type: apiArgs.alert_type
      });
      
    case 'blueshift_update_or_alert_customers':
      return await client.updateOrAlertCustomers({
        event: apiArgs.event,
        topic: apiArgs.topic,
        author: apiArgs.author,
        metadata: apiArgs.metadata
      });
    
    // ===== EXTERNAL FETCH =====
    case 'blueshift_list_external_fetch_templates':
      return await client.listExternalFetchTemplates(apiArgs);
      
    case 'blueshift_create_external_fetch_template':
      return await client.createExternalFetchTemplate(apiArgs);
      
    case 'blueshift_update_external_fetch_template':
      return await client.updateExternalFetchTemplate(
        apiArgs.template_uuid,
        apiArgs
      );
    
    // ===== EMAIL VALIDATION =====
    case 'blueshift_validate_email':
      return await client.validateEmail(apiArgs.email);
      
    case 'blueshift_validate_multiple_emails':
      return await client.validateMultipleEmails(apiArgs.emails);
    
    // ===== PROMOTIONS =====
    case 'blueshift_add_promo_codes':
      return await client.addPromoCodesToPromotion(
        apiArgs.promotion_uuid,
        apiArgs.promocodes
      );
      
    case 'blueshift_overwrite_promo_codes':
      return await client.overwritePromoCodesInPromotion(
        apiArgs.promotion_uuid,
        apiArgs.promocodes
      );
    
    // ===== UTILITIES =====
    case 'blueshift_list_adapters':
      return await client.listAdapters({
        channel_name: apiArgs.channel_name,
        adapter_name: apiArgs.adapter_name
      });
      
    case 'blueshift_list_tags':
      return await client.listTags(apiArgs);
      
    case 'blueshift_get_customer_events':
      return await client.getCustomerEvents(apiArgs);
    
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}