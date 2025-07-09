import { Tool } from '@modelcontextprotocol/sdk/types';
import { AccountManager } from '../account-manager';

export function createAllTools(accountManager: AccountManager): Tool[] {
  const accountList = accountManager.getAccountList();
  const siteNames = accountList.map(a => a.site);
  const defaultSite = accountManager.getDefaultAccount();
  
  // Helper to create site parameter
  const siteParam = {
    type: 'string' as const,
    description: `Blueshift site to use. Available: ${siteNames.join(', ')}${defaultSite ? ` (default: ${defaultSite})` : ''}`,
    enum: siteNames
  };

  return [
    // ===== ACCOUNT MANAGEMENT =====
    {
      name: 'blueshift_list_accounts',
      description: 'List all configured Blueshift accounts',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },

    // ===== CAMPAIGN MANAGEMENT =====
    {
      name: 'blueshift_execute_campaign',
      description: 'Trigger a campaign. The campaign must be set to trigger using an API call. In an event triggered campaign, in the Journey Start trigger, set "When event occurs" to "API Endpoint is called".',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          campaign_uuid: { 
            type: 'string', 
            description: 'UUID of the campaign to trigger. You can copy the UUID from the URL of the campaign in Blueshift (e.g., https://app.getblueshift.com/dashboard#/app/campaigns/<CAMPAIGN_UUID>/details)' 
          },
          email: { 
            type: 'string', 
            description: 'Email address of the user for whom you want to trigger the campaign' 
          },
          customer_id: { 
            type: 'string', 
            description: 'Customer ID (alternative to email)' 
          },
          email_attachments: {
            type: 'array',
            items: { type: 'string' },
            description: 'URLs of files to send as attachments with the email'
          },
          _bsft_high_priority: {
            type: 'boolean',
            description: 'Set to true if the campaign must be processed as high priority. High priority campaigns are processed first in FIFO order, followed by all other campaigns in FIFO order.',
            default: false
          },
          transaction_uuid: {
            type: 'string',
            description: 'Transaction UUID (must be well-formed) to avoid duplicate messages. API returns 200 for duplicate requests with a message noting the transaction was already processed.'
          },
          trigger_attributes: {
            type: 'object',
            description: 'Additional attributes for campaign personalization',
            additionalProperties: true
          }
        },
        required: ['campaign_uuid', 'email']
      }
    },
    {
      name: 'blueshift_bulk_execute_campaigns',
      description: 'Trigger multiple campaigns. The campaigns must be set to trigger using an API call',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          payloads: {
            type: 'array',
            description: 'List of campaign trigger payloads',
            items: {
              type: 'object',
              properties: {
                email: { 
                  type: 'string', 
                  description: 'Email address of the user for whom you want to trigger the campaign' 
                },
                campaign_uuid: { 
                  type: 'string', 
                  description: 'UUID of the campaign to trigger. You can copy the UUID from the campaign URL in Blueshift' 
                },
                email_attachments: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'URLs of files to send as attachments with the email'
                }
              },
              required: ['email', 'campaign_uuid']
            }
          }
        },
        required: ['payloads']
      }
    },
    {
      name: 'blueshift_list_campaigns',
      description: 'Get the list of campaigns with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          name: { 
            type: 'string', 
            description: 'Search for campaigns that contain the specified string in the name' 
          },
          email: { 
            type: 'string', 
            description: 'Search for campaigns created by specified author email' 
          },
          created_after: { 
            type: 'string',
            format: 'date-time',
            description: 'Search for campaigns created after specified date and time (ISO 8601)'
          },
          created_before: { 
            type: 'string',
            format: 'date-time', 
            description: 'Search for campaigns created before specified date and time (ISO 8601)' 
          },
          startdate: { 
            type: 'string',
            format: 'date-time',
            description: 'Search for campaigns that started after specified date and time. If not specified, one-time campaigns show only those with start date within last 30 days'
          },
          archived: { 
            type: 'string',
            description: 'Search for campaigns with specified archived status. Set as "true" for archived campaigns' 
          },
          status: { 
            type: 'string',
            description: 'Search for campaigns with specified status' 
          },
          exec_term: {
            type: 'string',
            description: 'Search for campaigns of specified type',
            enum: ['one_time', 'recurring', 'on_going', 'transactional', 'onsite']
          },
          per_page: { 
            type: 'string', 
            description: 'Number of records to return per page' 
          },
          page: { 
            type: 'string', 
            description: 'Page number for search results' 
          }
        }
      }
    },
    {
      name: 'blueshift_get_campaign_detail',
      description: 'Get a detailed report of a specific campaign without stats. This provides better performance than the stats API if you only need campaign metadata.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          campaign_uuid: { 
            type: 'string', 
            description: 'UUID of the campaign for which you want a detailed report. You can copy the UUID from the URL of the campaign in Blueshift (e.g., https://app.getblueshift.com/dashboard#/app/campaigns/<CAMPAIGN_UUID>/details)' 
          }
        },
        required: ['campaign_uuid']
      }
    },
    {
      name: 'blueshift_get_campaign_detail_with_stats',
      description: 'Get a detailed report of a specific campaign with performance statistics',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          campaign_uuid: { 
            type: 'string', 
            description: 'UUID of the campaign for which you want a detailed report with stats' 
          },
          start_time: { 
            type: 'string', 
            description: 'Timestamp in ISO 8601 format to filter the report of the campaign after it',
            format: 'date-time'
          },
          end_time: { 
            type: 'string', 
            description: 'Timestamp in ISO 8601 format to filter the report of the campaign up to it',
            format: 'date-time'
          }
        },
        required: ['campaign_uuid', 'start_time', 'end_time']
      }
    },
    {
      name: 'blueshift_get_campaigns_performance_summary',
      description: 'Export the performance data of all campaigns for a given date range. Campaign metrics are calculated using the account time zone.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          start_time: { 
            type: 'string', 
            description: 'Timestamp in ISO 8601 format to filter the performance data of campaigns that ran after it',
            format: 'date-time'
          },
          end_time: { 
            type: 'string', 
            description: 'Timestamp in ISO 8601 format to filter the performance data of campaigns that ran before it',
            format: 'date-time'
          },
          status: { 
            type: 'string', 
            description: 'Specify a status to filter the campaigns',
            enum: ['draft', 'active', 'paused', 'archived', 'completed']
          },
          tag_data: { 
            type: 'string', 
            description: 'Specify tags to filter the campaigns. Format: folder_name:tag1,tag2,tag3'
          }
        },
        required: ['start_time', 'end_time']
      }
    },
    {
      name: 'blueshift_create_campaign',
      description: 'Create a new campaign. IMPORTANT: When invoking this tool, always ask the user for required and optional parameters before executing.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          campaign_type: { 
            type: 'string', 
            description: 'Specifies how the campaign is triggered',
            enum: ['event_triggered', 'one_time']
          },
          name: { type: 'string', description: 'The name of the campaign' },
          author: { type: 'string', description: 'Email address of the campaign author' },
          launch: { 
            type: 'boolean', 
            description: 'Determines if the campaign should be launched immediately (true) or saved as a draft (false)',
            default: true
          },
          startdate: { 
            type: 'string', 
            description: 'Campaign start time in ISO 8601 format. Default: current time',
            format: 'date-time'
          },
          enddate: { 
            type: 'string', 
            description: 'Campaign end time in ISO 8601 format. Default: runs indefinitely. Applicable only for event-triggered campaigns',
            format: 'date-time'
          },
          segment_uuid: { 
            type: 'string', 
            description: 'UUID of the segment associated with this campaign. Required only for one-time campaigns' 
          },
          triggering_event_name: { 
            type: 'string', 
            description: 'The event that triggers this campaign. Must match an Event Attribute in the Events dashboard. If left blank, the campaign is API triggered. Applicable only for event-triggered campaigns' 
          },
          bypass_message_limits: { 
            type: 'boolean', 
            description: 'Whether to bypass messaging limits',
            default: false 
          },
          bypass_global_inclusion_segment: { 
            type: 'boolean', 
            description: 'Whether to send messages to users outside the global inclusion segment',
            default: false 
          },
          skip_incrementing_user_message_limits: { 
            type: 'boolean', 
            description: 'Controls whether sent messages are excluded from the user\'s message counts',
            default: false 
          },
          remove_unsubscribe_from_email_headers: { 
            type: 'boolean', 
            description: 'Whether to exclude unsubscribe headers from emails',
            default: false 
          },
          send_summary_emails: { 
            type: 'string', 
            description: 'Email address to receive the campaign execution summary. Applicable only for one-time campaigns' 
          },
          send_to_unsubscribed: { 
            type: 'boolean', 
            description: 'Whether to send messages to unsubscribed users',
            default: false 
          },
          journey_concurrency: { 
            type: 'string', 
            description: 'Defines how often a user can enter the journey. Applicable only for event-triggered campaigns',
            enum: ['once_per_lifetime', 'once_at_any_time', 'multiple'],
            default: 'multiple'
          },
          seed_list_uuids: { 
            type: 'array', 
            items: { type: 'string' },
            description: 'An array of seed list UUIDs for testing campaigns' 
          },
          tag_data: { 
            type: 'string', 
            description: 'Tags associated with the campaign. Format: folder_name:tag1,tag2,tag3. Example: Regions:USA,Canada|Products:Electronics,Apparel' 
          },
          triggers: {
            type: 'array',
            description: 'You can add only one trigger at a time. If you add multiple triggers, the endpoint returns an error',
            maxItems: 1,
            minItems: 1,
            items: {
              type: 'object',
              properties: {
                trigger_name: { 
                  type: 'string', 
                  description: 'Name of the trigger for reference' 
                },
                template_uuid: { 
                  type: 'string', 
                  description: 'UUID of the template linked to this trigger (email, push, SMS, etc.)' 
                },
                utm_source: { 
                  type: 'string', 
                  description: 'UTM Source for tracking. Default: Set based on the account\'s backend configuration' 
                },
                utm_campaign: { 
                  type: 'string', 
                  description: 'UTM Campaign name. Default: Set based on the account\'s backend configuration' 
                },
                utm_medium: { 
                  type: 'string', 
                  description: 'UTM Medium (e.g., email, push). Default: Set based on the account\'s backend configuration' 
                },
                utm_content: { 
                  type: 'string', 
                  description: 'Identifies specific content variations within the campaign. Default: Set based on the account\'s backend configuration' 
                },
                utm_term: { 
                  type: 'string', 
                  description: 'UTM Term for keyword tracking. Default: Set based on the account\'s backend configuration' 
                },
                account_adapter_uuid: { 
                  type: 'string', 
                  description: 'UUID of the adapter for message sending. If left blank, the trigger uses the default adapter for the channel. Leave blank if using account_adapter_liquid_expression' 
                },
                account_adapter_liquid_expression: { 
                  type: 'string', 
                  description: 'Liquid expression to dynamically assign an adapter UUID. Leave account_adapter_uuid blank when using this' 
                },
                from_name: { 
                  type: 'string', 
                  description: 'Sender\'s name for email campaigns' 
                },
                from_address: { 
                  type: 'string', 
                  description: 'Sender\'s email address. It must match the adapter domain' 
                },
                reply_to_address: { 
                  type: 'string', 
                  description: 'Email address where replies are sent' 
                },
                custom_url_params: {
                  type: 'array',
                  description: 'Custom tracking parameters added to links',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: 'Parameter name' },
                      value: { type: 'string', description: 'Parameter value' }
                    },
                    required: ['name', 'value']
                  }
                }
              },
              required: ['trigger_name', 'template_uuid']
            }
          }
        },
        required: ['campaign_type', 'name', 'startdate', 'triggers'],
        allOf: [
          {
            if: { properties: { campaign_type: { const: 'one_time' } } },
            then: { required: ['segment_uuid'] }
          }
        ]
      }
    },
    {
      name: 'blueshift_launch_campaign',
      description: 'Launch an existing campaign immediately. Campaigns that are archived, completed, executing, or already launched cannot be launched. The API returns validation errors similar to those shown in the campaign UI.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          campaign_uuid: { 
            type: 'string', 
            description: 'UUID of the campaign to launch. You can find the campaign UUID in the URL of the campaign editor' 
          }
        },
        required: ['campaign_uuid']
      }
    },
    {
      name: 'blueshift_pause_campaign',
      description: 'Pause an active campaign. Only campaigns that are currently in Executing state can be paused. Archived and completed campaigns cannot be paused.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          campaign_uuid: { 
            type: 'string', 
            description: 'UUID of the campaign to pause. You can find the campaign_uuid in the campaign editor\'s URL' 
          }
        },
        required: ['campaign_uuid']
      }
    },
    {
      name: 'blueshift_archive_campaign',
      description: 'Archive a specific campaign by its UUID. On the campaign details page, you can locate the campaign\'s UUID directly within the URL in your browser\'s address bar.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          campaign_uuid: { 
            type: 'string', 
            description: 'UUID of the campaign to archive. You can find this in the campaign URL (e.g., https://app.getblueshift.com/dashboard#/app/campaigns/<CAMPAIGN_UUID>/details)' 
          }
        },
        required: ['campaign_uuid']
      }
    },
    {
      name: 'blueshift_unarchive_campaign',
      description: 'Unarchive a specific campaign by its UUID. On the campaign details page, you can locate the campaign\'s UUID directly within the URL in your browser\'s address bar.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          campaign_uuid: { 
            type: 'string', 
            description: 'UUID of the campaign to unarchive. You can find this in the campaign URL (e.g., https://app.getblueshift.com/dashboard#/app/campaigns/<CAMPAIGN_UUID>/details)' 
          }
        },
        required: ['campaign_uuid']
      }
    },
    {
      name: 'blueshift_bulk_archive_campaigns',
      description: 'Archive multiple campaigns by providing an array of UUIDs. You can archive up to 100 campaigns in a single request. If you need to process more than 100 campaigns, split them into smaller batches. You can retrieve campaign UUIDs using the List Campaigns API.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          campaign_uuids: { 
            type: 'array',
            items: { type: 'string' },
            description: 'List of campaign UUIDs to archive (maximum 100 per request)',
            maxItems: 100
          }
        },
        required: ['campaign_uuids']
      }
    },
    {
      name: 'blueshift_bulk_unarchive_campaigns',
      description: 'Unarchive multiple campaigns by providing an array of UUIDs. You can unarchive up to 100 campaigns in a single request. If you need to process more than 100 campaigns, split them into smaller batches.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          campaign_uuids: { 
            type: 'array',
            items: { type: 'string' },
            description: 'List of campaign UUIDs to unarchive (maximum 100 per request)',
            maxItems: 100
          }
        },
        required: ['campaign_uuids']
      }
    },
    {
      name: 'blueshift_update_campaign_schedule',
      description: 'Update the schedule of an existing campaign. Supports one_time, recurring, segment_triggered, event_triggered, and live_content campaigns',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          campaign_uuid: { 
            type: 'string', 
            description: 'UUID of the campaign to update' 
          },
          startdate: { 
            type: 'string', 
            description: 'Campaign start time in ISO 8601 format (e.g., 2025-07-01T14:02:36.000Z)',
            format: 'date-time'
          },
          enddate: { 
            type: 'string', 
            description: 'Campaign end time in ISO 8601 format. Leave empty for campaigns to run indefinitely',
            format: 'date-time'
          },
          recurring_schedule: {
            type: 'string',
            description: 'Schedule type for segment-triggered campaigns',
            enum: ['daily', 'continuously']
          },
          repeating_schedule_attributes: {
            type: 'object',
            description: 'Recurrence configuration for recurring campaigns',
            properties: {
              interval_size: {
                type: 'integer',
                description: 'Interval size for recurrence'
              },
              interval_unit: {
                type: 'string',
                description: 'Unit for the interval',
                enum: ['day', 'week', 'month']
              },
              day_of_month: {
                type: 'string',
                description: 'Monthly recurrence type',
                enum: ['nth_day', 'nth_weekday', 'last_day']
              },
              days_of_week: {
                type: 'array',
                description: 'Array of weekdays for recurrence',
                items: {
                  type: 'string',
                  enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
                }
              }
            }
          }
        },
        required: ['campaign_uuid', 'startdate']
      }
    },
    {
      name: 'blueshift_get_campaign_performance',
      description: 'Get campaign performance summary with key metrics',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          campaign_uuid: { type: 'string', description: 'Campaign UUID' },
          start_date: { type: 'string', description: 'Start date for metrics (ISO 8601)' },
          end_date: { type: 'string', description: 'End date for metrics (ISO 8601)' },
          metrics: { 
            type: 'array',
            items: { type: 'string' },
            description: 'Specific metrics to include' 
          }
        },
        required: ['campaign_uuid']
      }
    },

    // ===== CUSTOMER MANAGEMENT =====
    {
      name: 'blueshift_create_update_customer',
      description: 'Create a new customer or update an existing customer. You must specify either the email or the customer_id for the customer. We recommend that you limit the calls to this endpoint to 50 per second.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          email: { 
            type: 'string', 
            description: 'Specify the email ID of the customer that you want to create or whose details you want to update. Ensure that the email that you provide in this field does not contain more than 64 characters.',
            maxLength: 64
          },
          customer_id: { 
            type: 'string', 
            description: 'Specify the customer ID of the customer that you want to create or whose details you want to update.' 
          },
          phone_number: { 
            type: 'string', 
            description: 'Specify the phone number of the customer that you want to create or whose details you want to update. Ensure that it includes the country code, starts with a +, follows the E.164 standard, does not start with a 0, and contains 6 to 14 characters.',
            pattern: '^\\+[1-9]\\d{1,14}$'
          },
          firstname: { 
            type: 'string', 
            description: 'Specify the firstname of the customer that you want to create or whose details you want to update.' 
          },
          lastname: { 
            type: 'string', 
            description: 'Specify the lastname of the customer that you want to create or whose details you want to update.' 
          },
          gender: { 
            type: 'string', 
            description: 'Specify the gender (if required) of the customer that you want to create or whose details you want to update.' 
          }
        },
        anyOf: [
          { required: ['email'] },
          { required: ['customer_id'] }
        ],
        additionalProperties: true
      }
    },
    {
      name: 'blueshift_search_customer',
      description: 'Search for a customer using the email ID. Note: The response contains both a "user" object (the most relevant match) and a "users" array (all matches). For single matches, both contain the same data. For multiple matches, use the "user" object as the primary reference.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          email: { 
            type: 'string', 
            description: 'Email ID of the customer you want to search for' 
          }
        },
        required: ['email']
      }
    },
    {
      name: 'blueshift_get_customer',
      description: 'Use this endpoint to get the details of a customer using the customer\'s UUID',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          uuid: { 
            type: 'string', 
            description: 'Specify the UUID of the customer whose details you want to get' 
          }
        },
        required: ['uuid']
      }
    },
    {
      name: 'blueshift_bulk_update_customers',
      description: 'Use this endpoint to create or update details of multiple customers. The maximum number of users is limited to 50 per call. We recommend that you limit the number of bulk calls to 5 calls per sec (or 250 users per second).',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          customers: {
            type: 'array',
            description: 'Specify the details of the customers that you want to create or of the customers whose details you want to update',
            maxItems: 50,
            items: {
              type: 'object',
              properties: {
                email: { 
                  type: 'string', 
                  description: 'Specify the email address of the customer that you want to create or whose details you want to update. Ensure that the email that you provide here contains less than 64 characters.',
                  maxLength: 64
                },
                customer_id: { 
                  type: 'string', 
                  description: 'Specify the customer ID of the customer that you want to create or whose details you want to update.' 
                },
                firstname: { 
                  type: 'string', 
                  description: 'Specify the firstname of the customer that you want to create or whose details you want to update.' 
                },
                lastname: { 
                  type: 'string', 
                  description: 'Specify the lastname of the customer that you want to create or whose details you want to update.' 
                },
                uuid: { 
                  type: 'string', 
                  description: 'Specify the UUID of the customer that you want to create or whose details you want to update.' 
                }
              },
              required: ['email', 'customer_id'],
              additionalProperties: true
            }
          }
        },
        required: ['customers']
      }
    },
    {
      name: 'blueshift_delete_customer',
      description: 'Permanently delete all personal data of a customer. This action is irreversible and takes a couple of hours to complete. If there are multiple profile matches, this endpoint deletes the first matching customer. To delete all matching profiles, set delete_all_matching_customers=true. A request can delete up to 50 profiles. You must specify either email or customer_id.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          email: { 
            type: 'string', 
            description: 'Specify the email address of the customer that you want to delete' 
          },
          customer_id: { 
            type: 'string', 
            description: 'Specify the customer ID of the customer that you want to delete' 
          },
          delete_all_matching_customers: {
            type: 'boolean',
            description: 'Specify this value to true if you want to delete all matching profiles of a customer',
            default: false
          }
        },
        anyOf: [
          { required: ['email'] },
          { required: ['customer_id'] }
        ]
      }
    },
    {
      name: 'blueshift_forget_customer',
      description: 'Permanently delete all personal data associated with a customer and remove them from tracking. This action is irreversible and takes a couple of hours to complete. Once forgotten, the customer will be excluded from all campaigns. You must specify at least one identifier (email, customer_id, cookie, or device_id).',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          email: { 
            type: 'string', 
            description: 'Email address of the customer you want to stop tracking' 
          },
          customer_id: { 
            type: 'string', 
            description: 'ID of the customer you want to stop tracking' 
          },
          cookie: { 
            type: 'string', 
            description: 'Cookie ID assigned to the customer by your website to stop tracking them' 
          },
          device_id: { 
            type: 'string', 
            description: 'Device ID linked to the customer\'s mobile or web device to stop tracking them' 
          }
        },
        anyOf: [
          { required: ['email'] },
          { required: ['customer_id'] },
          { required: ['cookie'] },
          { required: ['device_id'] }
        ]
      }
    },
    {
      name: 'blueshift_unforget_customer',
      description: 'Start tracking a customer. After tracking is enabled, the customer becomes eligible for future campaigns. Note: If a customer was previously forgotten, an API call to this endpoint does not restore any previous data for the customer.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          email: { 
            type: 'string', 
            description: 'Specify the email address of the customer you want to start tracking.' 
          },
          customer_id: { 
            type: 'string', 
            description: 'Specify the ID of the customer you want to start tracking.' 
          },
          cookie: { 
            type: 'string', 
            description: 'Specify the cookie ID assigned to the customer by your website for tracking purposes.' 
          },
          device_id: { 
            type: 'string', 
            description: 'Specify the device ID linked to the customer\'s mobile or web device.' 
          }
        },
        anyOf: [
          { required: ['email'] },
          { required: ['customer_id'] },
          { required: ['cookie'] },
          { required: ['device_id'] }
        ]
      }
    },
    {
      name: 'blueshift_merge_customers',
      description: 'Merge two customer profiles. This operation merges the data from one customer (old customer) into another customer (new customer). The old customer profile will be deleted after the merge.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          customer_id: { 
            type: 'string', 
            description: 'The ID of the customer profile to be merged (old customer). This customer profile will be deleted after the merge.' 
          },
          bsft_new_customer_id: { 
            type: 'string', 
            description: 'The ID of the customer profile to merge into (new customer). This customer profile will retain all the merged data.' 
          }
        },
        required: ['customer_id', 'bsft_new_customer_id']
      }
    },

    // ===== EVENT TRACKING =====
    {
      name: 'blueshift_publish_event',
      description: 'Send an event from your server. Ensure you provide values for at least one of: customer_id, event, device_id, cookie or email. The event parameter is required and Claude will ask for it if not provided.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          event: { 
            type: 'string', 
            description: 'Name of the event (e.g., identify, view, add_to_cart, checkout, purchase, search, custom_event_name). Must not contain periods (.), whitespaces, be numeric, or exceed 64 characters',
            maxLength: 64
          },
          customer_id: { 
            type: 'string', 
            description: 'Customer ID. Provide at least this or one of: event, device_id, email, cookie' 
          },
          email: { 
            type: 'string', 
            description: 'User email address (e.g., abc@def.com). Provide at least this or one of: event, device_id, customer_id, cookie' 
          },
          device_id: { 
            type: 'string', 
            description: 'UUID of the device. Mobile specific (iOS/Android) device identifier. Provide at least this or one of: event, customer_id, email, cookie' 
          },
          cookie: { 
            type: 'string', 
            description: 'Blueshift cookie used as identifier for anonymous users' 
          },
          device_type: { 
            type: 'string', 
            description: 'Type of the device' 
          },
          device_token: { 
            type: 'string', 
            description: 'Token of the device. Include with device_id for mobile app user identification' 
          },
          device_idfa: { 
            type: 'string', 
            description: 'Advertising identifier (IDFA) on the device' 
          },
          device_idfv: { 
            type: 'string', 
            description: 'Identifier for vendor (IDFV) on the device' 
          },
          device_manufacturer: { 
            type: 'string', 
            description: 'Manufacturer of the device' 
          },
          os_name: { 
            type: 'string', 
            description: 'Operating system name' 
          },
          network_carrier: { 
            type: 'string', 
            description: 'Carrier on the mobile device' 
          },
          ip: { 
            type: 'string', 
            description: 'IP address of the device' 
          },
          latitude: { 
            type: 'string', 
            description: 'Latitude of the user location' 
          },
          longitude: { 
            type: 'string', 
            description: 'Longitude of the user location' 
          },
          event_uuid: { 
            type: 'string', 
            description: 'Unique identifier for the event in UUID format (e.g., 1234abcd-efgh-ijkl-1234-kfjadslk34iu). Must be unique',
            pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
          },
          timestamp: { 
            type: 'string', 
            description: 'Event timestamp (ISO 8601)',
            format: 'date-time'
          },
          properties: {
            type: 'object',
            description: 'Event-specific custom properties',
            additionalProperties: true
          }
        },
        required: ['event']
      }
    },
    {
      name: 'blueshift_publish_bulk_events',
      description: 'Send bulk events from your server. Each payload can contain up to 30 events and the total size cannot exceed 1MB. You must include at least one identifier (customer_id, email, device_id, or cookie) for each event. API Rate limit: 10,000 requests/min.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          events: {
            type: 'array',
            description: 'Array of event objects (maximum 30 events per payload, total size limit 1MB)',
            maxItems: 30,
            items: {
              type: 'object',
              properties: {
                event: { 
                  type: 'string', 
                  description: 'Name of the event (e.g., identify, view, add_to_cart, checkout, purchase, search, custom_event_name). Must not contain periods (.), whitespaces, be numeric, or exceed 64 characters',
                  maxLength: 64
                },
                customer_id: { 
                  type: 'string', 
                  description: 'Customer ID. Provide at least this or one of: email, device_id, cookie' 
                },
                email: { 
                  type: 'string', 
                  description: 'User email address (e.g., abc@def.com). Provide at least this or one of: customer_id, device_id, cookie' 
                },
                device_id: { 
                  type: 'string', 
                  description: 'UUID of the device. Mobile specific (iOS/Android) device identifier. Provide at least this or one of: customer_id, email, cookie' 
                },
                cookie: { 
                  type: 'string', 
                  description: 'Blueshift cookie used as identifier for anonymous users' 
                },
                device_type: { 
                  type: 'string', 
                  description: 'Type of the device' 
                },
                device_tokens: { 
                  type: 'string', 
                  description: 'Token of the device. Include with device_id for mobile app user identification' 
                },
                device_idfa: { 
                  type: 'string', 
                  description: 'Advertising identifier (IDFA) on the device' 
                },
                device_idfv: { 
                  type: 'string', 
                  description: 'Identifier for vendor (IDFV) on the device' 
                },
                device_manufacturer: { 
                  type: 'string', 
                  description: 'Manufacturer of the device' 
                },
                os_name: { 
                  type: 'string', 
                  description: 'Operating system name' 
                },
                network_carrier: { 
                  type: 'string', 
                  description: 'Carrier on the mobile device' 
                },
                ip: { 
                  type: 'string', 
                  description: 'IP address of the device' 
                },
                latitude: { 
                  type: 'string', 
                  description: 'Latitude of the user location' 
                },
                longitude: { 
                  type: 'string', 
                  description: 'Longitude of the user location' 
                },
                timestamp: { 
                  type: 'string', 
                  description: 'Event timestamp (ISO 8601)',
                  format: 'date-time'
                },
                properties: {
                  type: 'object',
                  description: 'Event-specific custom properties',
                  additionalProperties: true
                }
              },
              required: ['event'],
              anyOf: [
                { required: ['customer_id'] },
                { required: ['email'] },
                { required: ['device_id'] },
                { required: ['cookie'] }
              ]
            }
          }
        },
        required: ['events']
      }
    },
    {
      name: 'blueshift_get_recent_event',
      description: 'Fetch the most recent event. The event debugger API endpoint returns the most recent events our server has seen of each event type. This is useful for debugging event tracking.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam
        }
      }
    },
    {
      name: 'blueshift_get_event_summary',
      description: 'Get a summary of counted events including event counts, distribution by day, and processing errors. By default, returns data for the last 7 days',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          timestamp_start: { 
            type: 'string', 
            description: 'Filter data for events that occurred after this timestamp (ISO 8601 format)',
            format: 'date-time'
          },
          timestamp_end: { 
            type: 'string', 
            description: 'Filter data for events that occurred before this timestamp (ISO 8601 format)',
            format: 'date-time'
          }
        }
      }
    },
    {
      name: 'blueshift_debug_event_exports',
      description: 'Download the first 10 success and errored events in last 5 minutes for a data connector. Event data is sent in batches at 5-minute intervals with max 5 events per batch. Returns only the first 5 events in order, not all historical events. Error logs are stored in S3 at: bsft-customers/<site>/events_export/amplitude_de/errors/<year>/<month>/<day>',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          data_connector_uuid: { 
            type: 'string', 
            description: 'UUID of the data connector to debug. You can find this in the Event Exports page in the Blueshift UI' 
          }
        },
        required: ['data_connector_uuid']
      }
    },

    // ===== CATALOG MANAGEMENT =====
    {
      name: 'blueshift_create_catalog',
      description: 'Create a catalog in Blueshift. Returns the UUID of the created catalog.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          catalog: {
            type: 'object',
            description: 'Catalog details',
            properties: {
              name: { 
                type: 'string', 
                description: 'Name for the catalog that you want to create. Ensure that the value provided in this field is unique.' 
              }
            },
            required: ['name']
          }
        },
        required: ['catalog']
      }
    },
    {
      name: 'blueshift_list_catalogs',
      description: 'Get a list of all catalogs. Returns catalog information including UUID, name, item count, update method (API/file), update frequency, last processed time, feed status (active/inactive), and archived status',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam
        }
      }
    },
    {
      name: 'blueshift_add_catalog_items',
      description: 'Use this endpoint to add items to a catalog. You can add multiple items to a catalog in batches of 25 items at a time. If an item already exists, the item is updated with the details that you provide in the API call. We recommend that you limit the number of API calls to 5 per second.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          catalog_uuid: { 
            type: 'string', 
            description: 'Specify the uuid of the catalog to which you want to add the items. You can get the catalog\'s UUID from its URL. For example, if you open a catalog on the Blueshift app, its URL looks like https://app.getblueshift.com/dashboard#/app/catalogs/<CATALOG_UUID>/details.' 
          },
          syncUpdateWithProductData: {
            type: 'string',
            description: 'If you pass this query parameter, the API returns the UUID for products that are added successfully'
          },
          catalog: {
            type: 'object',
            description: 'Catalog object containing products',
            properties: {
              products: {
                type: 'array',
                description: 'Specify the items that you want to add to the catalog',
                maxItems: 25,
                items: {
                  type: 'object',
                  properties: {
                    product_id: { 
                      type: 'string', 
                      description: 'Specify the unique identifier of the item. This is what you pass in the product_ids in your events, and the values specified here must be the same. Ensure that the value that you provide in this field does not contain more than 64 characters.',
                      maxLength: 64
                    },
                    title: { 
                      type: 'string', 
                      description: 'Specify the title of the item. Ensure that the title that you provide in this field does not contain more than 255 characters.',
                      maxLength: 255
                    },
                    image: { 
                      type: 'string', 
                      description: 'Specify the link to the image of the item. Ensure that the URL that you provide in this field does not contain more than 500 characters.',
                      maxLength: 500
                    },
                    web_link: { 
                      type: 'string', 
                      description: 'Specify the URL of the item on your website. Ensure that the URL that you provide in this field does not contain more than 500 characters.',
                      maxLength: 500
                    },
                    availability: { 
                      type: 'string', 
                      description: 'Specify the availability of the item.' 
                    },
                    category: { 
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Specify the category/categories of the item' 
                    },
                    brand: { 
                      type: 'string', 
                      description: 'Specify the brand name of the item.' 
                    },
                    price: { 
                      type: 'string', 
                      description: 'Specify the selling price of an item.' 
                    },
                    msrp: { 
                      type: 'string', 
                      description: 'Specify the maximum suggested retail price of the item.' 
                    },
                    tags: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Specify an array of strings denoting grouping of similar products into collections or groups.'
                    },
                    parent_sku: {
                      type: 'string',
                      description: 'Provide the sku to tie all variants or child products together.'
                    },
                    latitude: {
                      type: 'string',
                      description: 'Specify the latitude of the user\'s location.'
                    },
                    longitude: {
                      type: 'string',
                      description: 'Specify the longitude of the user\'s location.'
                    }
                  },
                  required: ['product_id', 'title', 'image', 'web_link', 'availability', 'category'],
                  additionalProperties: true
                }
              }
            },
            required: ['products']
          }
        },
        required: ['catalog_uuid', 'catalog']
      }
    },
    {
      name: 'blueshift_get_catalog_details',
      description: 'Get details of a specific catalog. We recommend that you limit the number of API calls to 5 per second',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          catalog_uuid: { 
            type: 'string', 
            description: 'Specify the UUID of the catalog. You can get the catalog\'s UUID from its URL. For example, if you open a catalog on the Blueshift app, its URL looks like https://app.getblueshift.com/dashboard#/app/catalogs/<CATALOG_UUID>/details' 
          }
        },
        required: ['catalog_uuid']
      }
    },

    // ===== SEGMENTS =====
    {
      name: 'blueshift_list_segments',
      description: 'Get the list of customer segments with optional filtering and pagination',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          name: {
            type: 'string',
            description: 'Search for segments that contain the specified string in the name'
          },
          archived: {
            type: 'integer',
            description: 'Search for segments with specified archived status. Value can be 0 to get a list of un-archived segments or 1 to get a list of archived segments. Leave blank to get a list of all segments',
            enum: [0, 1]
          },
          per_page: {
            type: 'string',
            description: 'Specify the number of records to be returned per page'
          },
          page: {
            type: 'string',
            description: 'Specify the page number for the search results'
          }
        }
      }
    },
    {
      name: 'blueshift_get_segment_users',
      description: 'Get count of users in the segment',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          segment_uuid: { 
            type: 'string', 
            description: 'UUID of the segment.' 
          },
          refresh: {
            type: 'boolean',
            description: 'Trigger job to update segment counts. Counts are updated asynchronously in the background. Use refresh=true to trigger a new count update, and subsequently poll with refresh=false to retrieve updated counts.'
          },
          channels: {
            type: 'string',
            description: 'Channels can be one of: \'users\', \'email\', \'push\', \'sms\', or \'inApp\'. Parameter indicates which channel audience counts to refresh.',
            enum: ['users', 'email', 'push', 'sms', 'inApp']
          },
          bypass_global: {
            type: 'boolean',
            description: 'Set \'true\' to return counts bypassing the global inclusion segments.'
          }
        },
        required: ['segment_uuid']
      }
    },

    // ===== EMAIL TEMPLATES =====
    {
      name: 'blueshift_list_email_templates',
      description: 'Get the list of email templates with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          name: { 
            type: 'string', 
            description: 'Search for email templates that contain the specified string in the name of the template' 
          },
          archived: { 
            type: 'integer', 
            description: 'Search for templates with specified archived status. Use 0 for un-archived templates, 1 for archived templates. Leave blank for all templates',
            enum: [0, 1]
          },
          'resource.editor_type': { 
            type: 'string', 
            description: 'Search for templates of the specified type. Use "html" for HTML templates or "bee_editor" for Visual Editor templates. Leave blank for all templates',
            enum: ['html', 'bee_editor']
          },
          per_page: { 
            type: 'string', 
            description: 'Number of records to return per page' 
          },
          page: { 
            type: 'string', 
            description: 'Page number for the search results' 
          }
        }
      }
    },
    {
      name: 'blueshift_create_email_template',
      description: 'Create a new email template. Returns a JSON that provides the UUID of the created template.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          name: { 
            type: 'string', 
            description: 'Name for the template' 
          },
          author: { 
            type: 'string', 
            description: 'Email address of the template author' 
          },
          resource: {
            type: 'object',
            description: 'Template resource details',
            properties: {
              subject: { 
                type: 'string', 
                description: 'Subject line of the template' 
              },
              preheader: { 
                type: 'string', 
                description: 'Preheader line of the template' 
              },
              content: { 
                type: 'string', 
                description: 'Body of the template with its HTML content' 
              },
              skip_user_on_external_fetch_error: { 
                type: 'boolean', 
                description: 'Message is not sent to user if the external fetch encounters an error or does not return any data' 
              }
            },
            required: ['subject', 'content', 'skip_user_on_external_fetch_error']
          },
          template_properties: {
            type: 'array',
            description: 'Campaign behavior properties for the template',
            maxItems: 1,
            items: {
              type: 'object',
              properties: {
                skip_user_on_blank_products: { 
                  type: 'boolean', 
                  description: 'Skip user if products are blank' 
                },
                skip_user_on_blank_event_products: { 
                  type: 'boolean', 
                  description: 'Skip user if event products are blank' 
                }
              },
              required: ['skip_user_on_blank_products', 'skip_user_on_blank_event_products']
            }
          },
          account_algorithm_uuid: { 
            type: ['string', 'null'], 
            description: 'Recommendation scheme UUID for the template. Leave blank for no change to existing schemes. Send null to remove existing schemes.' 
          },
          external_fetches: {
            type: 'array',
            description: 'External fetches for the template',
            items: {
              type: 'object',
              properties: {
                uuid: { 
                  type: 'string', 
                  description: 'UUID of the external fetch' 
                }
              },
              required: ['uuid']
            }
          },
          transaction_mixins: {
            type: 'array',
            description: 'Transaction mixins for the template. Multiple mixins result in OR queries',
            items: {
              type: 'object',
              properties: {
                uuid: { 
                  type: 'string', 
                  description: 'UUID of the transaction mixin' 
                }
              },
              required: ['uuid']
            }
          },
          tag_data: { 
            type: 'string', 
            description: 'Tags in format: folder_name:tag1,tag2,tag3. Example: Regions:USA,China,Brazil. Tags must exist in your account.' 
          }
        },
        required: ['name', 'resource', 'template_properties']
      }
    },
    {
      name: 'blueshift_get_email_template',
      description: 'Get a JSON representation of your email template along with a list of campaigns using the template',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          template_uuid: { 
            type: 'string', 
            description: 'Specify the UUID of the template. The template uuids can be found by querying the index, or from the URL when you view a template in the Blueshift app. For example, in https://app.getblueshift.com/dashboard#/email_template_studio/<TEMPLATE_UUID>/edit/info, the <TEMPLATE_UUID> is the uuid you need.' 
          }
        },
        required: ['template_uuid']
      }
    },
    {
      name: 'blueshift_update_email_template',
      description: 'Update an existing email template. Remember to properly escape HTML content in JSON strings (e.g., use \\" instead of " in HTML attributes)',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          template_uuid: { 
            type: 'string', 
            description: 'UUID of the template to update. Can be found in the template URL (e.g., https://app.getblueshift.com/dashboard#/email_template_studio/<TEMPLATE_UUID>/edit/info)' 
          },
          resource: {
            type: 'object',
            description: 'Template resource details to update',
            properties: {
              subject: { 
                type: 'string', 
                description: 'Subject line of the template' 
              },
              preheader: { 
                type: 'string', 
                description: 'Preheader line of the template' 
              },
              content: { 
                type: 'string', 
                description: 'Body of the template with its HTML content. Ensure HTML attributes are properly escaped (e.g., <a href=\\"https://example.com\\">)' 
              },
              skip_user_on_external_fetch_error: { 
                type: 'boolean', 
                description: 'If true, message is not sent to user if external fetch encounters an error',
                default: true
              }
            }
          },
          template_properties: {
            type: 'array',
            description: 'Campaign behavior properties for the template',
            maxItems: 1,
            items: {
              type: 'object',
              properties: {
                skip_user_on_blank_products: { 
                  type: 'boolean', 
                  description: 'Skip user if products are blank',
                  default: true
                },
                skip_user_on_blank_event_products: { 
                  type: 'boolean', 
                  description: 'Skip user if event products are blank',
                  default: true
                }
              }
            }
          },
          account_algorithm_uuid: { 
            type: ['string', 'null'], 
            description: 'Recommendation scheme UUID. Leave blank for no change, send null to remove existing schemes' 
          },
          external_fetches: {
            type: 'array',
            description: 'External fetches for the template. Leave blank to remove existing fetches',
            items: {
              type: 'object',
              properties: {
                uuid: { 
                  type: 'string', 
                  description: 'UUID of the external fetch' 
                }
              },
              required: ['uuid']
            }
          },
          transaction_mixins: {
            type: 'array',
            description: 'Transaction mixins for the template. Leave blank to remove existing mixins. Multiple mixins result in OR queries',
            items: {
              type: 'object',
              properties: {
                uuid: { 
                  type: 'string', 
                  description: 'UUID of the transaction mixin' 
                }
              },
              required: ['uuid']
            }
          }
        },
        required: ['template_uuid']
      }
    },
    {
      name: 'blueshift_send_test_email',
      description: 'Send a test email to specific email addresses using the personalization context for a given user',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          id: { 
            type: 'string', 
            description: 'UUID of the template. Can be found in the template URL (e.g., https://app.getblueshift.com/dashboard#/email_template_studio/<TEMPLATE_UUID>/edit/info)' 
          },
          personalize_for: { 
            type: 'string', 
            description: 'Email address of the user whose personalization context should be used to send the test email' 
          },
          recipients: { 
            type: 'array', 
            description: 'Email addresses of the recipients',
            items: { type: 'string' }
          },
          from_name: { 
            type: 'string', 
            description: 'Name to use in the from field of the email (only applicable for email channel)' 
          },
          from_address: { 
            type: 'string', 
            description: 'Email address to use as the sender (e.g., support@blueshift.com). Only applicable for email channel. Check your adapter documentation for allowed domains.' 
          },
          reply_to_address: { 
            type: 'string', 
            description: 'Email address customers can reply to (only applicable for email channel). Check your adapter documentation.' 
          }
        },
        required: ['id', 'personalize_for']
      }
    },

    // ===== SMS TEMPLATES =====
    {
      name: 'blueshift_list_sms_templates',
      description: 'List all SMS templates. SMS templates contain the content that Blueshift uses to create and send text messages to your customers.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          'resource.message_type': {
            type: 'string',
            description: 'Search for SMS templates by the message type',
            enum: ['sms', 'mms']
          },
          name: {
            type: 'string',
            description: 'Search for SMS templates that contain the specified string in the name of the template'
          },
          archived: {
            type: 'integer',
            description: 'Search for templates with specified archived status. Value can be 0 to get a list of un-archived templates or 1 to get a list of archived templates. Leave blank to get a list of all templates',
            enum: [0, 1]
          },
          per_page: {
            type: 'string',
            description: 'Specify the number of records to be returned per page'
          },
          page: {
            type: 'string',
            description: 'Specify the page number for the search results'
          }
        }
      }
    },
    {
      name: 'blueshift_create_sms_template',
      description: 'Use this endpoint to create an SMS template',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          template: {
            type: 'object',
            description: 'Specify the properties of the template',
            properties: {
              name: { 
                type: 'string', 
                description: 'Specify the name of the template' 
              },
              author: { 
                type: 'string', 
                description: 'Specify the email address of the author of the template. For example, johndoe@blueshift.com' 
              },
              resource: {
                type: 'object',
                description: 'Specify the content of the template. For a message of type MMS, the media URL is a required field',
                properties: {
                  message_type: {
                    type: 'string',
                    description: 'Specify the type of the template. The type can be sms or mms',
                    enum: ['sms', 'mms'],
                    default: 'sms'
                  },
                  subject: {
                    type: 'string',
                    description: 'Specify the subject for an MMS template'
                  },
                  content: {
                    type: 'string',
                    description: 'Specify the content of the template. This content is used in the text message that a campaign triggers. This field is required for SMS messages'
                  },
                  media_url: {
                    type: 'string',
                    description: 'Specify the URL for the media for an MMS message. This field is required for MMS messages'
                  },
                  shorten_links: {
                    type: 'boolean',
                    description: 'Specify whether we should shorten URLs in a text message. We can track link clicks if you set this value to true',
                    default: true
                  }
                },
                required: []
              },
              tag_data: { 
                type: 'string', 
                description: 'Specify a folder and then tags under the folder in the format folder_name: tag1, tag2, tag3. For example, Regions:USA,China,Brazil,Hong Kong,India,Sweden,Canada. Tag data should exist in your account' 
              },
              skip_user_on_external_fetch_error: { 
                type: 'boolean', 
                description: 'Message is not sent to user if the external fetch encounters an error or does not return any data' 
              },
              template_property: {
                type: 'object',
                description: 'Specify the campaign behavior properties for the template',
                properties: {
                  skip_user_on_blank_products: { 
                    type: 'boolean', 
                    description: 'Skip user if products are blank' 
                  },
                  skip_user_on_blank_event_products: { 
                    type: 'boolean', 
                    description: 'Skip user if event products are blank' 
                  }
                },
                required: ['skip_user_on_blank_products', 'skip_user_on_blank_event_products']
              },
              account_algorithm_uuid: { 
                type: ['string', 'null'], 
                description: 'Specify the recommendation scheme for the template. If you leave this field blank, no change will be done to any recommendation schemes that were previously added to the template. If you send null as a value, any recommendation schemes that were previously added to the template will be removed' 
              },
              external_fetches: {
                type: 'array',
                description: 'Specify the external fetches for the template',
                items: {
                  type: 'object',
                  properties: {
                    uuid: { 
                      type: 'string', 
                      description: 'UUID of the external fetch' 
                    }
                  },
                  required: ['uuid']
                }
              },
              transaction_mixins: {
                type: 'array',
                description: 'Specify the transaction mixins for the template',
                items: {
                  type: 'object',
                  properties: {
                    uuid: { 
                      type: 'string', 
                      description: 'UUID of the transaction mixin' 
                    }
                  },
                  required: ['uuid']
                }
              }
            },
            required: ['name', 'resource', 'skip_user_on_external_fetch_error', 'template_property']
          }
        },
        required: ['template']
      }
    },
    {
      name: 'blueshift_update_sms_template',
      description: 'Update an existing SMS template',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          template_uuid: { 
            type: 'string', 
            description: 'Template UUID to update',
            pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          },
          template: {
            type: 'object',
            description: 'SMS template data',
            properties: {
              name: { 
                type: 'string', 
                description: 'Template name',
                minLength: 1
              },
              subject: { 
                type: 'string', 
                description: 'SMS Subject',
                minLength: 1
              },
              template_property: {
                type: 'object',
                description: 'Template properties',
                properties: {
                  external_fetches: {
                    type: 'array',
                    description: 'Array of external fetch UUIDs',
                    items: {
                      type: 'object',
                      properties: {
                        uuid: { 
                          type: 'string', 
                          description: 'UUID of the external fetch template' 
                        }
                      },
                      required: ['uuid']
                    }
                  },
                  transaction_mixins: {
                    type: 'array',
                    description: 'Array of transaction mixin UUIDs',
                    items: {
                      type: 'object',
                      properties: {
                        uuid: { 
                          type: 'string', 
                          description: 'UUID of the transaction mixin' 
                        }
                      },
                      required: ['uuid']
                    }
                  }
                },
                required: []
              },
              resource: {
                type: 'object',
                description: 'SMS template resource details',
                properties: {
                  content: { 
                    type: 'string', 
                    description: 'SMS message body content' 
                  },
                  media_url: {
                    type: 'string',
                    description: 'URL of the media file to include in the SMS message',
                    format: 'uri'
                  },
                  shorten_links: {
                    type: 'boolean',
                    description: 'Whether to shorten links in the SMS message'
                  }
                },
                required: ['content']
              }
            },
            required: ['name', 'subject', 'resource']
          }
        },
        required: ['template_uuid', 'template']
      }
    },
    {
      name: 'blueshift_send_test_sms',
      description: 'Send a test SMS message. You can use this to test an SMS template that you create in Blueshift.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          uuid: { 
            type: 'string', 
            description: 'UUID of the template that you want to use to send a test SMS message' 
          },
          mobile: { 
            type: 'string', 
            description: 'Mobile number of the individual who should receive the test SMS message with the country code. For example, if the phone number is 23456789 and the country code is 1, specify as 123456789' 
          },
          personalize_for: { 
            type: 'string', 
            description: 'Email address of the customer whose information we should use to customize the SMS message. For example, if you want the message to contain the first name of a specific customer, specify that customer\'s email address' 
          }
        },
        required: ['uuid', 'mobile', 'personalize_for']
      }
    },

    // ===== PUSH TEMPLATES =====
    {
      name: 'blueshift_list_push_templates',
      description: 'Use this endpoint to get the list of push templates',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          name: { 
            type: 'string', 
            description: 'Search for push templates that contain the specified string in the name of the template' 
          },
          archived: { 
            type: 'integer', 
            description: 'Search for templates with specified archived status. Value can be 0 to get a list of un-archived templates or 1 to get a list of archived templates. Leave blank to get a list of all templates',
            enum: [0, 1]
          },
          per_page: { 
            type: 'string', 
            description: 'Specify the number of records to be returned per page' 
          },
          page: { 
            type: 'string', 
            description: 'Specify the page number for the search results' 
          }
        }
      }
    },
    {
      name: 'blueshift_create_push_template',
      description: 'Create a push template for sending push notifications to mobile devices',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          push_template: {
            type: 'object',
            description: 'Push template details',
            properties: {
              name: { 
                type: 'string', 
                description: 'Name of the template. For example, My API created template' 
              },
              author: { 
                type: 'string', 
                description: 'Email address of the author of the template' 
              },
              message_type: { 
                type: 'string', 
                description: 'Message type. Only json is supported',
                enum: ['json'],
                default: 'json'
              },
              device_type: { 
                type: 'string', 
                description: 'Type of device to target',
                enum: ['both', 'apple', 'android'],
                default: 'both'
              },
              content: { 
                type: 'string', 
                description: 'JSON payload of the notification. Example: "{\"GCM\":{\"notification\":{\"title\":\"Notification Content\"}},\"APNS\":{\"aps\":{\"alert\":\"Hello world!\"}}}\"' 
              },
              tag_data: { 
                type: 'string', 
                description: 'Tags in format: folder_name:tag1,tag2,tag3. Example: Regions:USA,China,Brazil. Tags must exist in your account.' 
              },
              skip_user_on_external_fetch_error: { 
                type: 'boolean', 
                description: 'Message is not sent to user if the external fetch encounters an error or does not return any data' 
              },
              template_property: {
                type: 'object',
                description: 'Campaign behavior properties for the template',
                properties: {
                  skip_user_on_blank_products: { 
                    type: 'boolean', 
                    description: 'Skip user if products are blank' 
                  },
                  skip_user_on_blank_event_products: { 
                    type: 'boolean', 
                    description: 'Skip user if event products are blank' 
                  }
                },
                required: ['skip_user_on_blank_products', 'skip_user_on_blank_event_products']
              },
              account_algorithm_uuid: { 
                type: ['string', 'null'], 
                description: 'Recommendation scheme UUID. Leave blank for no change, send null to remove existing schemes' 
              },
              external_fetches: {
                type: 'array',
                description: 'External fetches for the template',
                items: {
                  type: 'object',
                  properties: {
                    uuid: { 
                      type: 'string', 
                      description: 'UUID of the external fetch' 
                    }
                  },
                  required: ['uuid']
                }
              },
              transaction_mixins: {
                type: 'array',
                description: 'Transaction mixins for the template',
                items: {
                  type: 'object',
                  properties: {
                    uuid: { 
                      type: 'string', 
                      description: 'UUID of the transaction mixin' 
                    }
                  },
                  required: ['uuid']
                }
              }
            },
            required: ['name', 'content', 'skip_user_on_external_fetch_error', 'template_property']
          }
        },
        required: ['push_template']
      }
    },
    {
      name: 'blueshift_update_push_template',
      description: 'Update an existing push template',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          template_uuid: { 
            type: 'string', 
            description: 'UUID of the template to update. Can be found in the template URL (e.g., https://app.getblueshift.com/dashboard#/app/push_template/studio/<TEMPLATE_UUID>/edit/info)' 
          },
          push_template: {
            type: 'object',
            description: 'Push template update details',
            properties: {
              message_type: { 
                type: 'string', 
                description: 'Only json message type is supported',
                enum: ['json'],
                default: 'json'
              },
              device_type: { 
                type: 'string', 
                description: 'Type of device to target' 
              },
              content: { 
                type: 'string', 
                description: 'JSON payload of the notification. Example: "{\"GCM\":{\"notification\":{\"title\":\"Notification Content\"}},\"APNS\":{\"aps\":{\"alert\":\"Hello world!\"}}}". Leave GCM empty for iOS only, leave APNS empty for Android only.' 
              },
              tag_data: { 
                type: 'string', 
                description: 'Tags in format: folder_name:tag1,tag2,tag3. Tags must exist in your account.' 
              },
              skip_user_on_external_fetch_error: { 
                type: 'boolean', 
                description: 'Message is not sent to user if the external fetch encounters an error or does not return any data',
                default: true
              },
              template_property: {
                type: 'object',
                description: 'Campaign behavior properties for the template',
                properties: {
                  skip_user_on_blank_products: { 
                    type: 'boolean',
                    default: true
                  },
                  skip_user_on_blank_event_products: { 
                    type: 'boolean',
                    default: true
                  }
                }
              },
              account_algorithm_uuid: { 
                type: ['string', 'null'], 
                description: 'Recommendation scheme UUID. Leave blank for no change, send null to remove existing schemes' 
              },
              external_fetches: {
                type: 'array',
                description: 'External fetches for the template. Leave blank to remove existing fetches',
                items: { type: 'string' }
              },
              transaction_mixins: {
                type: 'array',
                description: 'Transaction mixins for the template. Leave blank to remove existing mixins',
                items: {
                  type: 'object',
                  properties: {
                    uuid: { 
                      type: 'string', 
                      description: 'UUID of the transaction mixin' 
                    }
                  },
                  required: ['uuid']
                }
              }
            }
          }
        },
        required: ['template_uuid']
      }
    },
    {
      name: 'blueshift_send_test_push',
      description: 'Push a test message to users. This sends a test push notification using the specified template.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          uuid: { 
            type: 'string', 
            description: 'UUID of the template. You can find the UUID from the template URL (e.g., https://app.getblueshift.com/dashboard#/app/push_template/studio/<TEMPLATE_UUID>/edit/info)' 
          },
          personalize_for: { 
            type: 'string', 
            description: 'Email address of the user profile for whom you want to personalize the test push message' 
          },
          email: { 
            type: 'string', 
            description: 'Email address of the user to whom you want to push the test message' 
          }
        },
        required: ['uuid', 'personalize_for']
      }
    },

    // ===== CUSTOM USER LISTS =====
    {
      name: 'blueshift_create_user_list',
      description: 'Create an empty user list. You can identify the list that you create using the name on the dashboard. Ensure that the name you specify is unique.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          name: { 
            type: 'string', 
            description: 'Specify a name for the list. You can identify the list that you create using this name on the dashboard. Ensure that the name that you specify is unique.' 
          },
          description: { 
            type: 'string', 
            description: 'Specify an appropriate description that provides context on what the list contains.' 
          },
          is_seed_list: {
            type: 'integer',
            description: 'Specify if this list is a seed list or not. Specify 0 if this is not a seed list. If it is, specify 1. A seed list is a list of users -- such as internal users -- who should receive a copy of the message that you send in a campaign.',
            enum: [0, 1],
            default: 0
          },
          source: {
            type: 'string',
            description: 'Specify the source that you want to use to add customers to this list. You can specify either email or customer_id. If you leave this field empty, email is automatically selected for the list.',
            enum: ['email', 'customer_id'],
            default: 'email'
          }
        },
        required: ['name', 'description']
      }
    },
    {
      name: 'blueshift_add_to_user_list',
      description: 'Add a user to a custom list using their identifier',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          list_id: { 
            type: 'integer', 
            description: 'ID of the list to which you want to add a user' 
          },
          identifier_key: { 
            type: 'string', 
            description: 'Key that you use to identify a customer. This field can either take customer_id or email',
            enum: ['customer_id', 'email']
          },
          identifier_value: { 
            type: 'string', 
            description: 'Value of the identifier key. For example, if you specify customer_id in the identifier_key field, specify the user\'s alphanumeric customer ID. If you specify email in the identifier_key, specify the user\'s email address' 
          }
        },
        required: ['list_id', 'identifier_key', 'identifier_value']
      }
    },
    {
      name: 'blueshift_bulk_add_to_user_list',
      description: 'Bulk add users to a custom list. You can add a maximum of 25 users in one API call.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          list_id: { 
            type: 'string', 
            description: 'Specify the ID of the list to which you want to add users in bulk' 
          },
          identifier_key: {
            type: 'string',
            description: 'Specify the key that you use to identify the users. This field can either take customer_id or email.',
            enum: ['customer_id', 'email']
          },
          identifier_values: {
            type: 'array',
            description: 'Specify the values of the identifier key. For example, if you specify customer_id in the identifier_key field, specify the users\' alphanumeric customer IDs in this field (e.g., ["abcd1234"]). If you specify email in the identifier_key, specify the email addresses of the users you want to add to the list (e.g., ["johndoe@blueshift.com"]).',
            items: { type: 'string' },
            maxItems: 25,
            minItems: 1
          }
        },
        required: ['list_id', 'identifier_key', 'identifier_values']
      }
    },
    {
      name: 'blueshift_remove_from_user_list',
      description: 'Remove a user from a custom list',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          list_id: { 
            type: 'string', 
            description: 'Specify the ID of the list from which you want to remove a user' 
          },
          identifier_key: { 
            type: 'string', 
            description: 'Specify the key that you use to identify a user. This field can either take customer_id or email',
            enum: ['customer_id', 'email']
          },
          identifier_value: { 
            type: 'string', 
            description: 'Specify the value of the identifier key. For example, if you specify customer_id in the identifier_key field, specify the user\'s alphanumeric customer ID in this field. If you specify email in the identifier_key, specify the user\'s email address' 
          }
        },
        required: ['list_id', 'identifier_key', 'identifier_value']
      }
    },
    {
      name: 'blueshift_bulk_remove_from_user_list',
      description: 'Bulk remove users from a custom list. You can remove maximum 25 users in one API call.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          list_id: { 
            type: 'string', 
            description: 'Specify the ID of the list from which you want to remove users in bulk' 
          },
          identifier_key: { 
            type: 'string', 
            description: 'Specify the key that you use to identify the users. This field can either take customer_id or email',
            enum: ['customer_id', 'email']
          },
          identifier_values: { 
            type: 'array', 
            description: 'Specify the values of the identifier key. For example, if you specify customer_id in the identifier_key field, specify the users\' alphanumeric customer IDs in this field. If you specify email in the identifier_key, specify the email addresses of the users you want to remove from the list. Maximum 25 users per API call.',
            items: { type: 'string' },
            maxItems: 25
          }
        },
        required: ['list_id', 'identifier_key', 'identifier_values']
      }
    },
    {
      name: 'blueshift_get_user_list',
      description: 'Get details of a specific user list',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          custom_user_list_id: { type: 'string', description: 'Custom user list ID' }
        },
        required: ['custom_user_list_id']
      }
    },
    {
      name: 'blueshift_get_seed_lists',
      description: 'Get the seed lists from your account',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam
        }
      }
    },
    {
      name: 'blueshift_overwrite_users_in_list',
      description: 'Overwrite all users in a custom user list using an S3 file. This API currently only accepts files uploaded in the Blueshift S3 bucket. It is recommended to upload the file under the import/custom_lists path within the Blueshift S3 bucket assigned to your Blueshift account.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          list_id: { 
            type: 'string', 
            description: 'Specify the ID of the list to which you want to overwrite users' 
          },
          s3_file_path: { 
            type: 'string', 
            description: 'Specify the S3 path of the file containing identifiers that will overwrite users in the custom user list. The recommendation is to upload the file to the import/custom_lists location under the Blueshift S3 bucket.' 
          }
        },
        required: ['list_id', 's3_file_path']
      }
    },

    // ===== LIVE CONTENT =====
    {
      name: 'blueshift_get_live_content',
      description: 'Insert content recommendations in your website and mobile apps. Create a live content campaign, select the target segment, flight dates, slot name and JSON template',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          slot: { 
            type: 'string', 
            description: 'Name of the slot on your website as registered on the Blueshift app' 
          },
          api_key: { 
            type: 'string', 
            description: 'Event API key from the account settings page. If not provided, will use the default Event API key for the selected site' 
          },
          user: {
            type: 'object',
            description: 'User identification object',
            properties: {
              customer_id: { 
                type: 'string', 
                description: 'Customer ID of the user' 
              },
              email: { 
                type: 'string', 
                description: 'Email address of the user' 
              },
              cookie: { 
                type: 'string', 
                description: 'Blueshift cookie as identifier for anonymous users' 
              },
              device_id: { 
                type: 'string', 
                description: 'UUID of the device' 
              }
            }
          },
          context: {
            type: 'object',
            description: 'Context for recommendations',
            properties: {
              seed_item_ids: {
                type: 'array',
                items: { type: 'string' },
                description: 'IDs of items that form the basis of replay or related items'
              },
              exclude_item_ids: {
                type: 'array',
                items: { type: 'string' },
                description: 'IDs of items that should be excluded from the response'
              },
              exclude_categories: {
                type: 'array',
                items: { type: 'string' },
                description: 'Categories that should be excluded from the response'
              },
              page_number: {
                type: 'integer',
                description: 'Get more pages of recommendations if pagination is enabled for your account'
              }
            }
          }
        },
        required: ['slot']
      }
    },
    {
      name: 'blueshift_list_live_content_slots',
      description: 'Get the list of live content slots. Use this endpoint to retrieve slots that can display personalized content in campaigns.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          name: {
            type: 'string',
            description: 'Search for live content slot that contain the specified string in the name of the slot. Leave blank to get a list of all slots.'
          },
          slot_format: {
            type: 'string',
            description: 'Search for live content slots based on their format. This filter is case insensitive, and values can be HTML, JSON, Popup, or Landing Page. Leave blank to get a list of all slots.',
            enum: ['HTML', 'JSON', 'Popup', 'Landing Page']
          },
          active: {
            type: 'boolean',
            description: 'Search for live content slots based on active filter. When true, returns slots linked to campaigns not in "Completed" or "Archived" states. When false, returns slots those unused by campaigns or associated with campaigns in "Completed" or "Archived" states. Leave blank to get a list of all slots.'
          }
        }
      }
    },

    // ===== INTEREST ALERTS =====
    {
      name: 'blueshift_get_customer_subscriptions',
      description: 'Get all the topics that a customer has subscribed to. You must specify at least one of the following fields: email, uuid, customer_id, phone_number, or device_id.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          email: {
            type: 'string',
            description: 'Specify the customer\'s email address. For example, abc@def.com. You must specify this value, or one of the following fields: uuid, customer_id, phone_number, or device_id.'
          },
          uuid: {
            type: 'string',
            description: 'The unique identifier for the customer.'
          },
          customer_id: {
            type: 'string',
            description: 'Specify the customer ID.'
          },
          phone_number: {
            type: 'string',
            description: 'Specify the phone number of the customer. Ensure that it includes the country code, starts with a +, follows the E.164 standard, does not start with a 0, and contains 6 to 14 characters. For example, +14155553467.',
            pattern: '^\\+[1-9]\\d{5,13}$'
          },
          device_id: {
            type: 'string',
            description: 'Specify the UUID of the device.'
          }
        },
        anyOf: [
          { required: ['email'] },
          { required: ['uuid'] },
          { required: ['customer_id'] },
          { required: ['phone_number'] },
          { required: ['device_id'] }
        ]
      }
    },
    {
      name: 'blueshift_subscribe_to_topic',
      description: 'Subscribe customer to an interest alert topic',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          email: { type: 'string', description: 'Customer email' },
          customer_id: { type: 'string', description: 'Customer ID' },
          topic: { type: 'string', description: 'Topic to subscribe to' },
          alert_type: { 
            type: 'string', 
            description: 'Type of alert (email, sms, push, etc.)',
            enum: ['email', 'sms', 'push', 'in_app']
          },
          frequency: {
            type: 'string',
            description: 'Alert frequency',
            enum: ['immediate', 'daily', 'weekly', 'monthly']
          },
          metadata: {
            type: 'object',
            description: 'Additional metadata for the subscription',
            additionalProperties: true
          }
        },
        required: ['topic', 'alert_type'],
        anyOf: [
          { required: ['email'] },
          { required: ['customer_id'] }
        ]
      }
    },
    {
      name: 'blueshift_unsubscribe_from_topic',
      description: 'Unsubscribe customer from an interest alert topic',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          email: { type: 'string', description: 'Customer email' },
          customer_id: { type: 'string', description: 'Customer ID' },
          topic: { type: 'string', description: 'Topic to unsubscribe from' },
          alert_type: { 
            type: 'string', 
            description: 'Type of alert to unsubscribe from',
            enum: ['email', 'sms', 'push', 'in_app', 'all']
          }
        },
        required: ['topic'],
        anyOf: [
          { required: ['email'] },
          { required: ['customer_id'] }
        ]
      }
    },
    {
      name: 'blueshift_update_or_alert_customers',
      description: 'Send an update to or alert customers about topics that they have subscribed to. Use the metadata parameter to add custom attributes to provide more information about the update (e.g., city, discount, coupon code).',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          event: { 
            type: 'string', 
            description: 'Specify the name of the event for which the alert is being sent' 
          },
          topic: { 
            type: 'string', 
            description: 'Specify the topic that the alert is for' 
          },
          author: { 
            type: 'string', 
            description: 'Specify the email address for the author of the alert' 
          },
          metadata: {
            type: 'object',
            description: 'Specify the metadata attribute name and value for the topic. Use this to add custom attributes like city, discount, coupon code, etc.',
            additionalProperties: true
          }
        },
        required: ['event', 'topic', 'author', 'metadata']
      }
    },

    // ===== EXTERNAL FETCH =====
    {
      name: 'blueshift_list_external_fetch_templates',
      description: 'Get the list of external fetch templates',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          per_page: { 
            type: 'string', 
            description: 'Specify the number of records to be returned per page' 
          },
          page: { 
            type: 'string', 
            description: 'Specify the page number for the search results' 
          }
        }
      }
    },
    {
      name: 'blueshift_create_external_fetch_template',
      description: 'Create an external fetch template. The external fetch URL may include dynamic liquid variables such as user id, email address, product ids, and more.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          alias_name: { 
            type: 'string', 
            description: 'Specify the name of the external fetch template. The alias_name can contain lowercase alphanumeric characters and underscores only.' 
          },
          author: { 
            type: 'string', 
            description: 'Specify the email address of the author of the template.' 
          },
          http_method: { 
            type: 'string', 
            description: 'HTTP method to fetch the data. Set GET or POST as the method.',
            enum: ['GET', 'POST']
          },
          auth_header: { 
            type: 'string', 
            description: 'Along with the auth_token, specifies the details for secure URLs.' 
          },
          auth_token: { 
            type: 'string', 
            description: 'Along with the auth_header, specifies the details for secure URLs.' 
          },
          url: { 
            type: 'string', 
            description: 'The external URL. The external fetch URL may include dynamic liquid variables such as user id, email address, product ids, and more.' 
          },
          body: { 
            type: 'string', 
            description: 'Specify the JSON payload if the http_method is POST.' 
          },
          test_context: { 
            type: 'string', 
            description: 'Specify the test context for the template.' 
          }
        },
        required: ['alias_name', 'http_method', 'url']
      }
    },
    {
      name: 'blueshift_update_external_fetch_template',
      description: 'Update an existing external fetch template',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          template_uuid: { 
            type: 'string', 
            description: 'Specify the UUID of the template that you want to update. You can get the template UUID from the URL when you view a template in the Blueshift app. For example, in https://app.getblueshift.com/dashboard#/app/external_fetches/<TEMPLATE_UUID>/edit, the <TEMPLATE_UUID> is the uuid that you need.' 
          },
          alias_name: {
            type: 'string',
            description: 'Specify the name of the external fetch template. The alias_name can contain lowercase alphanumeric characters and underscores only.',
            pattern: '^[a-z0-9_]+$'
          },
          author: {
            type: 'string',
            description: 'Specify the email address of the author of the template.',
            format: 'email'
          },
          http_method: {
            type: 'string',
            description: 'HTTP method to fetch the data. Set GET or POST as the method.',
            enum: ['GET', 'POST']
          },
          auth_header: {
            type: 'string',
            description: 'Along with the auth_token, specifies the details for secure URLs.'
          },
          auth_token: {
            type: 'string',
            description: 'Along with the auth_header, specifies the details for secure URLs.'
          },
          url: {
            type: 'string',
            description: 'The external URL. The external fetch URL may include dynamic liquid variables such as user id, email address, product ids, and more.',
            format: 'uri'
          },
          body: {
            type: 'string',
            description: 'Specify the JSON payload if the http_method is POST.'
          },
          test_context: {
            type: 'string',
            description: 'Specify the test context for the template.'
          }
        },
        required: ['template_uuid']
      }
    },

    // ===== EMAIL VALIDATION =====
    {
      name: 'blueshift_validate_email',
      description: 'Validate a single email address and assess its deliverability and risk profile. This API checks if an individual email address is valid, risky, disposable, or role-based. It helps you improve deliverability by validating emails before sending campaigns. Note: This endpoint is not available by default and requires special access from your CSM.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          email: { 
            type: 'string', 
            description: 'The email address to validate. Maximum: 512 characters.',
            format: 'email',
            maxLength: 512
          }
        },
        required: ['email']
      }
    },
    {
      name: 'blueshift_validate_multiple_emails',
      description: 'Validate up to 30 email addresses at once. This feature requires custom setup and is not available by default. Contact Blueshift Support or your CSM to enable access. This API helps you identify risky or invalid addresses before launching campaigns at scale.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          emails: {
            type: 'array',
            description: 'An array of email addresses to validate. Maximum: 30 emails per request.',
            items: {
              type: 'string',
              format: 'email',
              maxLength: 512
            },
            maxItems: 30,
            minItems: 1
          }
        },
        required: ['emails']
      }
    },

    // ===== PROMOTIONS =====
    {
      name: 'blueshift_add_promo_codes',
      description: 'Add promo codes to existing promotion. The API can update a maximum of 1000 promo codes per request. If an API call includes more than 1000 promo codes, a 400 error will be returned.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          promotion_uuid: { 
            type: 'string', 
            description: 'Specify the UUID of the promotion to which you want to add promo codes.' 
          },
          promocodes: {
            type: 'array',
            description: 'Array of promo codes to overwrite the current list.',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 1000
          }
        },
        required: ['promotion_uuid', 'promocodes']
      }
    },
    {
      name: 'blueshift_overwrite_promo_codes',
      description: 'Replace all existing promo codes in a promotion with a new set of codes. The API can update a maximum of 1000 promo codes per request.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          promotion_uuid: { 
            type: 'string', 
            description: 'Specify the UUID of the promotion to which you want to add promo codes. You can find this in the Promotions section UUID column or in the URL when editing a promotion.' 
          },
          promocodes: {
            type: 'array',
            description: 'List of promo codes to replace the current set. Maximum of 1000 promo codes per request.',
            items: { type: 'string' },
            maxItems: 1000,
            minItems: 0
          }
        },
        required: ['promotion_uuid', 'promocodes']
      }
    },

    // ===== OTHER UTILITIES =====
    {
      name: 'blueshift_list_adapters',
      description: 'List all the adapters that you use in your Blueshift account. An adapter is an entity that provides integrations to other third party services such as Mailgun to send emails and Infobip to send SMSes. Your account can have multiple adapters for different channels.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          channel_name: {
            type: 'string',
            description: 'Specify the name of the channel whose adapters you want to see. Values that you can provide in this field are: Email, SMS, Push Message, Webhook, InApp, and Segment Report. This field is required.',
            enum: ['Email', 'SMS', 'Push Message', 'Webhook', 'InApp', 'Segment Report']
          },
          adapter_name: {
            type: 'string',
            description: 'Specify the name of the adapter that you want to search. For example, sendgrid or sparkpost. This field is optional.'
          }
        },
        required: ['channel_name']
      }
    },
    {
      name: 'blueshift_list_tags',
      description: 'List all tags and tag folders in your Blueshift account. You can use tags to organize your entities. Optionally filter by specific resource type and UUID.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          resource_type: {
            type: 'string',
            description: 'Specify the specific resource whose tags you want to see. For example, you can specify Segment or Campaign. This field is optional.'
          },
          resource_uuid: {
            type: 'string',
            description: 'Specify the UUID of the resource whose tags you want to see. For example, 1234-abcd-2345-efgh. You can get the resource\'s UUID from its URL. For example, if you open a campaign in the Blueshift app, its URL looks like https://app.getblueshift.com/dashboard#/app/campaigns/<CAMPAIGN_UUID>/details. This field is optional.'
          }
        }
      }
    },
    {
      name: 'blueshift_get_customer_events',
      description: 'Fetch the details of the events for a customer using the customer\'s UUID. This API endpoint is provided for debugging purposes only and supports a maximum of 10 calls per hour.',
      inputSchema: {
        type: 'object',
        properties: {
          site: siteParam,
          uuid: { 
            type: 'string', 
            description: 'Specify the uuid of the customer whose event details you want to fetch' 
          }
        },
        required: ['uuid']
      }
    }
  ];
}