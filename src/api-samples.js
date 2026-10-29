/* ---------- API reference samples ----------
   Requests and responses recorded against a test tenant on 2026-10-29. Identifiers, names, addresses and amounts
   are replaced with Contoso placeholders, and directory objects are trimmed to a few properties. */
const API_SAMPLES = {
 "ops": {
  "tenantBalance": {
   "title": "Get tenant credit balance",
   "method": "GET",
   "path": "copilot/costManagement/getTenantCreditBalance",
   "headers": [],
   "body": null,
   "status": "200 OK",
   "response": "{\n  \"@odata.context\": \"https://graph.microsoft.com/beta/$metadata#microsoft.graph.costManagementTenantCreditBalance\",\n  \"billingMethodBalances\": [\n    {\n      \"billingMethod\": \"prepaidCredits\",\n      \"purchasedQuantity\": 50000,\n      \"consumedQuantity\": 18420.5,\n      \"remainingQuantity\": 31579.5,\n      \"unit\": \"copilotCredit\",\n      \"dataStatus\": {\n        \"lastModifiedDateTime\": \"2026-10-29T09:50:58.357Z\"\n      }\n    },\n    {\n      \"billingMethod\": \"payAsYouGo\",\n      \"consumedQuantity\": 1240.75,\n      \"unit\": \"copilotCredit\",\n      \"dataStatus\": {\n        \"lastModifiedDateTime\": \"2026-10-29T09:50:58.357Z\"\n      }\n    }\n  ]\n}"
  },
  "listPolicies": {
   "title": "List spendingPolicies",
   "method": "GET",
   "path": "copilot/costManagement/spendingPolicies",
   "headers": [],
   "body": null,
   "status": "200 OK",
   "response": "{\n  \"@odata.context\": \"https://graph.microsoft.com/beta/$metadata#copilot/costManagement/spendingPolicies\",\n  \"value\": [\n    {\n      \"@odata.type\": \"#microsoft.graph.selectedGroupsSpendingPolicy\",\n      \"@odata.etag\": \"\\\"9abebb12-0ce7-4766-abb7-796842d5723e\\\"\",\n      \"id\": \"4e4c0555-12ef-4c46-a47d-fe0117cf53fa\",\n      \"displayName\": \"All Users Policy\",\n      \"status\": \"enabled\",\n      \"billingMethods\": \"prepaidCredits,payAsYouGo\",\n      \"createdDateTime\": \"2026-10-14T10:19:32Z\",\n      \"lastModifiedDateTime\": \"2026-10-29T08:30:22Z\",\n      \"periodLimit\": {\n        \"@odata.type\": \"#microsoft.graph.unlimitedCostManagementQuantity\",\n        \"unit\": \"copilotCredit\"\n      },\n      \"perUserLimit\": {\n        \"@odata.type\": \"#microsoft.graph.unlimitedCostManagementQuantity\",\n        \"unit\": \"copilotCredit\"\n      },\n      \"createdBy\": {\n        \"application\": null,\n        \"device\": null,\n        \"additionalData\": [],\n        \"user\": {\n          \"displayName\": null,\n          \"id\": \"36bcd5b7-d0eb-420f-a805-84dc9163fae3\",\n          \"additionalData\": []\n        }\n      },\n      \"lastModifiedBy\": {\n        \"application\": null,\n        \"device\": null,\n        \"additionalData\": [],\n        \"user\": {\n          \"displayName\": null,\n          \"id\": \"36bcd5b7-d0eb-420f-a805-84dc9163fae3\",\n          \"additionalData\": []\n        }\n      }\n    }\n  ]\n}"
  },
  "createPolicy": {
   "title": "Create spendingPolicy (selectedGroupsSpendingPolicy, no audience)",
   "method": "POST",
   "path": "copilot/costManagement/spendingPolicies",
   "headers": [
    "Content-Type: application/json"
   ],
   "body": "{\n  \"@odata.type\": \"#microsoft.graph.selectedGroupsSpendingPolicy\",\n  \"displayName\": \"Pilot spending cap\",\n  \"periodLimit\": {\n    \"@odata.type\": \"#microsoft.graph.limitedCostManagementQuantity\",\n    \"value\": 1000,\n    \"unit\": \"copilotCredit\"\n  },\n  \"perUserLimit\": {\n    \"@odata.type\": \"#microsoft.graph.limitedCostManagementQuantity\",\n    \"value\": 100,\n    \"unit\": \"copilotCredit\"\n  },\n  \"billingMethods\": \"prepaidCredits\",\n  \"serviceSettings\": [\n    {\n      \"serviceId\": \"workIQ\",\n      \"state\": \"enabled\"\n    }\n  ]\n}",
   "status": "201 Created",
   "response": "{\n  \"@odata.context\": \"https://graph.microsoft.com/beta/$metadata#copilot/costManagement/spendingPolicies/$entity\",\n  \"@odata.type\": \"#microsoft.graph.selectedGroupsSpendingPolicy\",\n  \"@odata.etag\": \"\\\"04f217a1-6fff-491f-a74d-7577f3c847f9\\\"\",\n  \"id\": \"af9989b8-f607-45bc-a27b-f8d464e624b7\",\n  \"displayName\": \"Pilot spending cap\",\n  \"status\": \"disabled\",\n  \"billingMethods\": \"prepaidCredits\",\n  \"createdDateTime\": \"2026-10-29T11:05:16Z\",\n  \"lastModifiedDateTime\": \"2026-10-29T11:05:16Z\",\n  \"periodLimit\": {\n    \"@odata.type\": \"#microsoft.graph.limitedCostManagementQuantity\",\n    \"value\": 1000,\n    \"unit\": \"copilotCredit\"\n  },\n  \"perUserLimit\": {\n    \"@odata.type\": \"#microsoft.graph.limitedCostManagementQuantity\",\n    \"value\": 100,\n    \"unit\": \"copilotCredit\"\n  },\n  \"createdBy\": {\n    \"application\": null,\n    \"device\": null,\n    \"user\": {\n      \"displayName\": null,\n      \"id\": \"36bcd5b7-d0eb-420f-a805-84dc9163fae3\"\n    }\n  },\n  \"lastModifiedBy\": {\n    \"application\": null,\n    \"device\": null,\n    \"user\": {\n      \"displayName\": null,\n      \"id\": \"36bcd5b7-d0eb-420f-a805-84dc9163fae3\"\n    }\n  },\n  \"assignedGroups\": [],\n  \"emailThresholdSettings@odata.context\": \"https://graph.microsoft.com/beta/$metadata#copilot/costManagement/spendingPolicies('af9989b8-f607-45bc-a27b-f8d464e624b7')/microsoft.graph.selectedGroupsSpendingPolicy/emailThresholdSettings/$entity\",\n  \"emailThresholdSettings\": null,\n  \"serviceSettings@odata.context\": \"https://graph.microsoft.com/beta/$metadata#copilot/costManagement/spendingPolicies('af9989b8-f607-45bc-a27b-f8d464e624b7')/microsoft.graph.selectedGroupsSpendingPolicy/serviceSettings\",\n  \"serviceSettings\": [\n    {\n      \"serviceId\": \"workIQ\",\n      \"state\": \"enabled\",\n      \"parentStatus\": \"disabled\",\n      \"parentEtag\": \"\\\"04f217a1-6fff-491f-a74d-7577f3c847f9\\\"\"\n    }\n  ]\n}"
  },
  "getPolicy": {
   "title": "Get spendingPolicy",
   "method": "GET",
   "path": "copilot/costManagement/spendingPolicies/4e4c0555-12ef-4c46-a47d-fe0117cf53fa",
   "headers": [],
   "body": null,
   "status": "200 OK",
   "response": "{\n  \"@odata.context\": \"https://graph.microsoft.com/beta/$metadata#copilot/costManagement/spendingPolicies/$entity\",\n  \"@odata.type\": \"#microsoft.graph.selectedGroupsSpendingPolicy\",\n  \"@odata.etag\": \"\\\"9abebb12-0ce7-4766-abb7-796842d5723e\\\"\",\n  \"id\": \"4e4c0555-12ef-4c46-a47d-fe0117cf53fa\",\n  \"displayName\": \"All Users Policy\",\n  \"status\": \"enabled\",\n  \"billingMethods\": \"prepaidCredits,payAsYouGo\",\n  \"createdDateTime\": \"2026-10-14T10:19:32Z\",\n  \"lastModifiedDateTime\": \"2026-10-29T08:30:22Z\",\n  \"periodLimit\": {\n    \"@odata.type\": \"#microsoft.graph.unlimitedCostManagementQuantity\",\n    \"unit\": \"copilotCredit\"\n  },\n  \"perUserLimit\": {\n    \"@odata.type\": \"#microsoft.graph.unlimitedCostManagementQuantity\",\n    \"unit\": \"copilotCredit\"\n  },\n  \"createdBy\": {\n    \"application\": null,\n    \"device\": null,\n    \"additionalData\": [],\n    \"user\": {\n      \"displayName\": null,\n      \"id\": \"36bcd5b7-d0eb-420f-a805-84dc9163fae3\",\n      \"additionalData\": []\n    }\n  },\n  \"lastModifiedBy\": {\n    \"application\": null,\n    \"device\": null,\n    \"additionalData\": [],\n    \"user\": {\n      \"displayName\": null,\n      \"id\": \"36bcd5b7-d0eb-420f-a805-84dc9163fae3\",\n      \"additionalData\": []\n    }\n  }\n}"
  },
  "updatePolicy": {
   "title": "Update spendingPolicy (displayName, periodLimit, perUserLimit)",
   "method": "PATCH",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7",
   "headers": [
    "If-Match: \"04f217a1-6fff-491f-a74d-7577f3c847f9\"",
    "Content-Type: application/json"
   ],
   "body": "{\n  \"displayName\": \"Pilot spending cap updated\",\n  \"periodLimit\": {\n    \"@odata.type\": \"#microsoft.graph.limitedCostManagementQuantity\",\n    \"value\": 1200,\n    \"unit\": \"copilotCredit\"\n  },\n  \"perUserLimit\": {\n    \"@odata.type\": \"#microsoft.graph.limitedCostManagementQuantity\",\n    \"value\": 150,\n    \"unit\": \"copilotCredit\"\n  }\n}",
   "status": "200 OK",
   "response": "{\n  \"@odata.context\": \"https://graph.microsoft.com/beta/$metadata#copilot/costManagement/spendingPolicies/$entity\",\n  \"@odata.type\": \"#microsoft.graph.selectedGroupsSpendingPolicy\",\n  \"@odata.etag\": \"\\\"224500d2-61fb-49a3-a491-111e9ae48508\\\"\",\n  \"id\": \"af9989b8-f607-45bc-a27b-f8d464e624b7\",\n  \"displayName\": \"Pilot spending cap updated\",\n  \"status\": \"disabled\",\n  \"billingMethods\": \"prepaidCredits\",\n  \"createdDateTime\": \"2026-10-29T11:05:16Z\",\n  \"lastModifiedDateTime\": \"2026-10-29T11:05:17Z\",\n  \"periodLimit\": {\n    \"@odata.type\": \"#microsoft.graph.limitedCostManagementQuantity\",\n    \"unit\": \"copilotCredit\",\n    \"value\": 1200\n  },\n  \"perUserLimit\": {\n    \"@odata.type\": \"#microsoft.graph.limitedCostManagementQuantity\",\n    \"unit\": \"copilotCredit\",\n    \"value\": 150\n  },\n  \"createdBy\": {\n    \"application\": null,\n    \"device\": null,\n    \"additionalData\": [],\n    \"user\": {\n      \"displayName\": null,\n      \"id\": \"36bcd5b7-d0eb-420f-a805-84dc9163fae3\",\n      \"additionalData\": []\n    }\n  },\n  \"lastModifiedBy\": {\n    \"application\": null,\n    \"device\": null,\n    \"additionalData\": [],\n    \"user\": {\n      \"displayName\": null,\n      \"id\": \"36bcd5b7-d0eb-420f-a805-84dc9163fae3\",\n      \"additionalData\": []\n    }\n  }\n}"
  },
  "deletePolicy": {
   "title": "Delete spendingPolicy",
   "method": "DELETE",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7",
   "headers": [
    "If-Match: \"d29c7423-795b-4547-ae28-fb03d980f2fc\""
   ],
   "body": null,
   "status": "204 No Content",
   "response": null
  },
  "listGroups": {
   "title": "List assignedGroups",
   "method": "GET",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7/microsoft.graph.selectedGroupsSpendingPolicy/assignedGroups",
   "headers": [],
   "body": null,
   "status": "200 OK",
   "response": "{\n  \"@odata.context\": \"https://graph.microsoft.com/beta/$metadata#groups\",\n  \"value\": [\n    {\n      \"id\": \"71251d4b-edf9-40ea-a8c0-4c5debd25d45\",\n      \"displayName\": \"Copilot Pilot B\",\n      \"description\": \"Security group for the Copilot pilot.\",\n      \"groupTypes\": [],\n      \"mailEnabled\": false,\n      \"securityEnabled\": true,\n      \"membershipRule\": null\n    },\n    {\n      \"id\": \"18d98985-bc4a-4828-adae-daf58d40fd01\",\n      \"displayName\": \"Copilot Pilot A\",\n      \"description\": \"Security group for the Copilot pilot.\",\n      \"groupTypes\": [],\n      \"mailEnabled\": false,\n      \"securityEnabled\": true,\n      \"membershipRule\": null\n    }\n  ]\n}"
  },
  "addGroup": {
   "title": "Add assignedGroup (test group A)",
   "method": "POST",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7/microsoft.graph.selectedGroupsSpendingPolicy/assignedGroups/$ref",
   "headers": [
    "If-Match: \"33c6fd21-8e04-4741-a8c9-9f281152336e\"",
    "Content-Type: application/json"
   ],
   "body": "{\n  \"@odata.id\": \"https://graph.microsoft.com/beta/groups/18d98985-bc4a-4828-adae-daf58d40fd01\"\n}",
   "status": "204 No Content",
   "response": null
  },
  "removeGroup": {
   "title": "Remove assignedGroup (test group B)",
   "method": "DELETE",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7/microsoft.graph.selectedGroupsSpendingPolicy/assignedGroups/71251d4b-edf9-40ea-a8c0-4c5debd25d45/$ref",
   "headers": [
    "If-Match: \"29ac8e74-afd6-40d4-a47f-99a03d220b06\""
   ],
   "body": null,
   "status": "204 No Content",
   "response": null
  },
  "listServiceSettings": {
   "title": "List serviceSettings",
   "method": "GET",
   "path": "copilot/costManagement/spendingPolicies/4e4c0555-12ef-4c46-a47d-fe0117cf53fa/serviceSettings",
   "headers": [],
   "body": null,
   "status": "200 OK",
   "response": "{\n  \"@odata.context\": \"https://graph.microsoft.com/beta/$metadata#copilot/costManagement/spendingPolicies('4e4c0555-12ef-4c46-a47d-fe0117cf53fa')/serviceSettings\",\n  \"value\": [\n    {\n      \"serviceId\": \"cowork\",\n      \"state\": \"enabled\",\n      \"parentStatus\": \"enabled\",\n      \"parentEtag\": \"\\\"9abebb12-0ce7-4766-abb7-796842d5723e\\\"\"\n    },\n    {\n      \"serviceId\": \"workIQ\",\n      \"state\": \"enabled\",\n      \"parentStatus\": \"enabled\",\n      \"parentEtag\": \"\\\"9abebb12-0ce7-4766-abb7-796842d5723e\\\"\"\n    },\n    {\n      \"serviceId\": \"sharePointCopilot\",\n      \"state\": \"enabled\",\n      \"parentStatus\": \"enabled\",\n      \"parentEtag\": \"\\\"9abebb12-0ce7-4766-abb7-796842d5723e\\\"\"\n    },\n    {\n      \"serviceId\": \"oneDriveCopilot\",\n      \"state\": \"enabled\",\n      \"parentStatus\": \"enabled\",\n      \"parentEtag\": \"\\\"9abebb12-0ce7-4766-abb7-796842d5723e\\\"\"\n    }\n  ]\n}"
  },
  "createServiceSetting": {
   "title": "Create serviceSetting (cowork enabled)",
   "method": "POST",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7/serviceSettings",
   "headers": [
    "If-Match: \"224500d2-61fb-49a3-a491-111e9ae48508\"",
    "Content-Type: application/json"
   ],
   "body": "{\n  \"serviceId\": \"cowork\",\n  \"state\": \"enabled\"\n}",
   "status": "201 Created",
   "response": "{\n  \"@odata.context\": \"https://graph.microsoft.com/beta/$metadata#copilot/costManagement/spendingPolicies('af9989b8-f607-45bc-a27b-f8d464e624b7')/serviceSettings/$entity\",\n  \"serviceId\": \"cowork\",\n  \"state\": \"enabled\",\n  \"parentStatus\": \"disabled\",\n  \"parentEtag\": \"\\\"2d221abb-0f85-4f8a-aaf3-9a677d10fecc\\\"\"\n}"
  },
  "getServiceSetting": {
   "title": "Get serviceSetting \"cowork\"",
   "method": "GET",
   "path": "copilot/costManagement/spendingPolicies/4e4c0555-12ef-4c46-a47d-fe0117cf53fa/serviceSettings/cowork",
   "headers": [],
   "body": null,
   "status": "200 OK",
   "response": "{\n  \"@odata.context\": \"https://graph.microsoft.com/beta/$metadata#copilot/costManagement/spendingPolicies('4e4c0555-12ef-4c46-a47d-fe0117cf53fa')/serviceSettings/$entity\",\n  \"serviceId\": \"cowork\",\n  \"state\": \"enabled\",\n  \"parentStatus\": \"enabled\",\n  \"parentEtag\": \"\\\"9abebb12-0ce7-4766-abb7-796842d5723e\\\"\"\n}"
  },
  "updateServiceSetting": {
   "title": "Update serviceSetting (cowork disabled)",
   "method": "PATCH",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7/serviceSettings/cowork",
   "headers": [
    "If-Match: \"2d221abb-0f85-4f8a-aaf3-9a677d10fecc\"",
    "Content-Type: application/json"
   ],
   "body": "{\n  \"state\": \"disabled\"\n}",
   "status": "200 OK",
   "response": "{\n  \"@odata.context\": \"https://graph.microsoft.com/beta/$metadata#copilot/costManagement/spendingPolicies('af9989b8-f607-45bc-a27b-f8d464e624b7')/serviceSettings/$entity\",\n  \"serviceId\": \"cowork\",\n  \"state\": \"disabled\",\n  \"parentStatus\": \"disabled\",\n  \"parentEtag\": \"\\\"6651708a-dbc1-4d1d-a700-33e4047c01ec\\\"\"\n}"
  },
  "getAlertSetting": {
   "title": "Get emailThresholdSettings",
   "method": "GET",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7/emailThresholdSettings",
   "headers": [],
   "body": null,
   "status": "200 OK",
   "response": "{\n  \"@odata.context\": \"https://graph.microsoft.com/beta/$metadata#copilot/costManagement/spendingPolicies('af9989b8-f607-45bc-a27b-f8d464e624b7')/emailThresholdSettings/$entity\",\n  \"@odata.etag\": \"\\\"c84ca518-1173-4523-a637-5908de3b2cac\\\"\",\n  \"id\": \"af9989b8-f607-45bc-a27b-f8d464e624b7\",\n  \"isEnabled\": false,\n  \"thresholds\": [\n    {\n      \"@odata.type\": \"#microsoft.graph.percentageCostManagementAlertThreshold\",\n      \"value\": 80\n    },\n    {\n      \"@odata.type\": \"#microsoft.graph.absoluteCostManagementAlertThreshold\",\n      \"value\": 500,\n      \"unit\": \"copilotCredit\"\n    }\n  ]\n}"
  },
  "updateAlertSetting": {
   "title": "Update emailThresholdSettings (create, disabled, 80% + 500 credits)",
   "method": "PATCH",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7/emailThresholdSettings",
   "headers": [
    "If-Match: \"6651708a-dbc1-4d1d-a700-33e4047c01ec\"",
    "Content-Type: application/json"
   ],
   "body": "{\n  \"isEnabled\": false,\n  \"thresholds\": [\n    {\n      \"@odata.type\": \"#microsoft.graph.percentageCostManagementAlertThreshold\",\n      \"value\": 80\n    },\n    {\n      \"@odata.type\": \"#microsoft.graph.absoluteCostManagementAlertThreshold\",\n      \"value\": 500,\n      \"unit\": \"copilotCredit\"\n    }\n  ]\n}",
   "status": "200 OK",
   "response": "{\n  \"@odata.context\": \"https://graph.microsoft.com/beta/$metadata#copilot/costManagement/spendingPolicies('af9989b8-f607-45bc-a27b-f8d464e624b7')/emailThresholdSettings/$entity\",\n  \"@odata.etag\": \"\\\"c84ca518-1173-4523-a637-5908de3b2cac\\\"\",\n  \"id\": \"af9989b8-f607-45bc-a27b-f8d464e624b7\",\n  \"isEnabled\": false,\n  \"thresholds\": [\n    {\n      \"@odata.type\": \"#microsoft.graph.percentageCostManagementAlertThreshold\",\n      \"value\": 80\n    },\n    {\n      \"@odata.type\": \"#microsoft.graph.absoluteCostManagementAlertThreshold\",\n      \"value\": 500,\n      \"unit\": \"copilotCredit\"\n    }\n  ]\n}"
  },
  "deleteAlertSetting": {
   "title": "Delete emailThresholdSettings",
   "method": "DELETE",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7/emailThresholdSettings",
   "headers": [
    "If-Match: \"1f555fc8-12b8-4e45-a2ca-a6bc3cca752c\""
   ],
   "body": null,
   "status": "204 No Content",
   "response": null
  },
  "listRecipients": {
   "title": "List recipients",
   "method": "GET",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7/emailThresholdSettings/recipients",
   "headers": [],
   "body": null,
   "status": "200 OK",
   "response": "{\n  \"@odata.context\": \"https://graph.microsoft.com/beta/$metadata#users\",\n  \"value\": [\n    {\n      \"id\": \"36bcd5b7-d0eb-420f-a805-84dc9163fae3\",\n      \"displayName\": \"Adele Vance\",\n      \"userPrincipalName\": \"AdeleV@contoso.onmicrosoft.com\",\n      \"mail\": \"AdeleV@contoso.onmicrosoft.com\"\n    }\n  ]\n}"
  },
  "addRecipient": {
   "title": "Add recipient (signed-in user)",
   "method": "POST",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7/emailThresholdSettings/recipients/$ref",
   "headers": [
    "If-Match: \"c84ca518-1173-4523-a637-5908de3b2cac\"",
    "Content-Type: application/json"
   ],
   "body": "{\n  \"@odata.id\": \"https://graph.microsoft.com/beta/users/36bcd5b7-d0eb-420f-a805-84dc9163fae3\"\n}",
   "status": "204 No Content",
   "response": null
  },
  "removeRecipient": {
   "title": "Remove recipient",
   "method": "DELETE",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7/emailThresholdSettings/recipients/36bcd5b7-d0eb-420f-a805-84dc9163fae3/$ref",
   "headers": [
    "If-Match: \"56d86f01-ee99-4701-a80e-5c17b69822c7\""
   ],
   "body": null,
   "status": "204 No Content",
   "response": null
  },
  "getUserBalance": {
   "title": "Get costManagementUserBalance ($expand=serviceBalances)",
   "method": "GET",
   "path": "copilot/costManagement/userBalances/36bcd5b7-d0eb-420f-a805-84dc9163fae3?$expand=serviceBalances",
   "headers": [],
   "body": null,
   "status": "200 OK",
   "response": "{\n  \"@odata.context\": \"https://graph.microsoft.com/beta/$metadata#copilot/costManagement/userBalances(serviceBalances())/$entity\",\n  \"id\": \"36bcd5b7-d0eb-420f-a805-84dc9163fae3\",\n  \"unevaluatedServices\": [\n    {\n      \"serviceId\": \"cowork\",\n      \"reason\": \"noApplicablePolicy\"\n    },\n    {\n      \"serviceId\": \"workIQ\",\n      \"reason\": \"noApplicablePolicy\"\n    }\n  ],\n  \"selectionDataStatus\": {\n    \"evaluatedDateTime\": \"2026-10-29T11:05:14.7200631Z\",\n    \"policyConfigurationAsOfDateTime\": \"2026-10-29T11:02:13.3293802Z\",\n    \"groupMembershipAsOfDateTime\": \"2026-10-29T11:05:14.3985051Z\"\n  },\n  \"serviceBalances@odata.context\": \"https://graph.microsoft.com/beta/$metadata#copilot/costManagement/userBalances('36bcd5b7-d0eb-420f-a805-84dc9163fae3')/serviceBalances\",\n  \"serviceBalances\": []\n}"
  },
  "listServiceBalances": {
   "title": "List serviceBalances",
   "method": "GET",
   "path": "copilot/costManagement/userBalances/36bcd5b7-d0eb-420f-a805-84dc9163fae3/serviceBalances",
   "headers": [],
   "body": null,
   "status": "200 OK",
   "response": "{\n  \"@odata.context\": \"https://graph.microsoft.com/beta/$metadata#copilot/costManagement/userBalances('36bcd5b7-d0eb-420f-a805-84dc9163fae3')/serviceBalances\",\n  \"value\": []\n}"
  },
  "getServiceBalance": {
   "title": "Get serviceBalance \"workIQ\"",
   "method": "GET",
   "path": "copilot/costManagement/userBalances/36bcd5b7-d0eb-420f-a805-84dc9163fae3/serviceBalances/workIQ",
   "headers": [],
   "body": null,
   "status": "404 Not Found",
   "response": "{\n  \"error\": {\n    \"code\": \"notFound\",\n    \"message\": \"The requested resource does not exist.\",\n    \"innerError\": {\n      \"date\": \"2026-10-29T11:05:20\",\n      \"request-id\": \"dd145707-c89e-4052-ac47-4eaff29ba72e\",\n      \"client-request-id\": \"dd145707-c89e-4052-ac47-4eaff29ba72e\"\n    }\n  }\n}"
  }
 },
 "errors": [
  {
   "title": "Update spendingPolicy without If-Match",
   "method": "PATCH",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7",
   "headers": [
    "Content-Type: application/json"
   ],
   "body": "{\n  \"displayName\": \"Pilot spending cap x\"\n}",
   "status": "428 Precondition Required",
   "response": "{\n  \"error\": {\n    \"code\": \"preconditionRequired\",\n    \"message\": \"The If-Match header is required. Read the resource and supply its ETag.\",\n    \"innerError\": {\n      \"date\": \"2026-10-29T11:05:20\",\n      \"request-id\": \"d4948969-0f5f-49f9-aca6-0c4c5750a6f3\",\n      \"client-request-id\": \"d4948969-0f5f-49f9-aca6-0c4c5750a6f3\"\n    }\n  }\n}"
  },
  {
   "title": "Update spendingPolicy with stale If-Match",
   "method": "PATCH",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7",
   "headers": [
    "If-Match: \"04f217a1-6fff-491f-a74d-7577f3c847f9\"",
    "Content-Type: application/json"
   ],
   "body": "{\n  \"displayName\": \"Pilot spending cap stale\"\n}",
   "status": "412 Precondition Failed",
   "response": "{\n  \"error\": {\n    \"code\": \"preconditionFailed\",\n    \"message\": \"The ETag does not match the current resource version. Read the resource, reconcile changes, and retry with its current ETag.\",\n    \"innerError\": {\n      \"code\": \"etagMismatch\",\n      \"date\": \"2026-10-29T11:05:20\",\n      \"request-id\": \"51bda104-da4f-4906-a8e0-6ecd35929607\",\n      \"client-request-id\": \"51bda104-da4f-4906-a8e0-6ecd35929607\"\n    }\n  }\n}"
  },
  {
   "title": "Update server-managed property (status)",
   "method": "PATCH",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7",
   "headers": [
    "If-Match: \"224500d2-61fb-49a3-a491-111e9ae48508\"",
    "Content-Type: application/json"
   ],
   "body": "{\n  \"status\": \"enabled\"\n}",
   "status": "400 Bad Request",
   "response": "{\n  \"error\": {\n    \"code\": \"invalidRequest\",\n    \"message\": \"The request body does not match the spending policy update contract.\",\n    \"innerError\": {\n      \"date\": \"2026-10-29T11:05:20\",\n      \"request-id\": \"1bf23c71-f643-45c6-ada4-b1f446f8f6a4\",\n      \"client-request-id\": \"1bf23c71-f643-45c6-ada4-b1f446f8f6a4\"\n    }\n  }\n}"
  },
  {
   "title": "Update spendingPolicy (billingMethods prepaidCredits,payAsYouGo)",
   "method": "PATCH",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7",
   "headers": [
    "If-Match: \"224500d2-61fb-49a3-a491-111e9ae48508\"",
    "Content-Type: application/json"
   ],
   "body": "{\n  \"billingMethods\": \"prepaidCredits,payAsYouGo\"\n}",
   "status": "409 Conflict",
   "response": "{\n  \"error\": {\n    \"code\": \"invalidTransition\",\n    \"message\": \"The requested policy transition conflicts with its current state or funding configuration.\",\n    \"innerError\": {\n      \"date\": \"2026-10-29T11:05:20\",\n      \"request-id\": \"fd3e3371-d5c0-433b-a4a8-057643a74718\",\n      \"client-request-id\": \"fd3e3371-d5c0-433b-a4a8-057643a74718\"\n    }\n  }\n}"
  },
  {
   "title": "Create serviceSetting with unknown serviceId",
   "method": "POST",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7/serviceSettings",
   "headers": [
    "If-Match: \"6651708a-dbc1-4d1d-a700-33e4047c01ec\"",
    "Content-Type: application/json"
   ],
   "body": "{\n  \"serviceId\": \"notARealService\",\n  \"state\": \"enabled\"\n}",
   "status": "400 Bad Request",
   "response": "{\n  \"error\": {\n    \"code\": \"badRequest\",\n    \"message\": \"The requested service is not a recognized governable AI service.\",\n    \"details\": [\n      {\n        \"code\": \"badRequest\",\n        \"message\": \"The requested service is not a recognized governable AI service.\",\n        \"target\": \"serviceId\"\n      }\n    ],\n    \"innerError\": {\n      \"code\": \"invalidService\",\n      \"date\": \"2026-10-29T11:05:20\",\n      \"request-id\": \"536c1eba-621c-4275-a55a-f2822783aca4\",\n      \"client-request-id\": \"536c1eba-621c-4275-a55a-f2822783aca4\"\n    }\n  }\n}"
  },
  {
   "title": "Disable the last enabled service (workIQ)",
   "method": "PATCH",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7/serviceSettings/workIQ",
   "headers": [
    "If-Match: \"6651708a-dbc1-4d1d-a700-33e4047c01ec\"",
    "Content-Type: application/json"
   ],
   "body": "{\n  \"state\": \"disabled\"\n}",
   "status": "409 Conflict",
   "response": "{\n  \"error\": {\n    \"code\": \"conflict\",\n    \"message\": \"At least one service setting must remain enabled.\",\n    \"innerError\": {\n      \"code\": \"atLeastOneServiceRequired\",\n      \"date\": \"2026-10-29T11:05:20\",\n      \"request-id\": \"24cb3fdc-2991-4537-a2d0-0ddf522fab9e\",\n      \"client-request-id\": \"24cb3fdc-2991-4537-a2d0-0ddf522fab9e\"\n    }\n  }\n}"
  },
  {
   "title": "Update emailThresholdSettings with 150% threshold",
   "method": "PATCH",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7/emailThresholdSettings",
   "headers": [
    "If-Match: \"c84ca518-1173-4523-a637-5908de3b2cac\"",
    "Content-Type: application/json"
   ],
   "body": "{\n  \"thresholds\": [\n    {\n      \"@odata.type\": \"#microsoft.graph.percentageCostManagementAlertThreshold\",\n      \"value\": 150\n    }\n  ]\n}",
   "status": "400 Bad Request",
   "response": "{\n  \"error\": {\n    \"code\": \"invalidAlertThreshold\",\n    \"message\": \"The supplied alert thresholds are invalid.\",\n    \"innerError\": {\n      \"date\": \"2026-10-29T11:05:20\",\n      \"request-id\": \"f56b3f08-b3c6-40e0-a242-d04d57c6ce26\",\n      \"client-request-id\": \"f56b3f08-b3c6-40e0-a242-d04d57c6ce26\"\n    }\n  }\n}"
  },
  {
   "title": "Enable alerting without recipients",
   "method": "PATCH",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7/emailThresholdSettings",
   "headers": [
    "If-Match: \"c84ca518-1173-4523-a637-5908de3b2cac\"",
    "Content-Type: application/json"
   ],
   "body": "{\n  \"isEnabled\": true\n}",
   "status": "400 Bad Request",
   "response": "{\n  \"error\": {\n    \"code\": \"alertRecipientsRequired\",\n    \"message\": \"At least one alert recipient must be linked before alerting can be enabled.\",\n    \"innerError\": {\n      \"date\": \"2026-10-29T11:05:20\",\n      \"request-id\": \"3e82cb61-1415-489b-a527-d155bd7418af\",\n      \"client-request-id\": \"3e82cb61-1415-489b-a527-d155bd7418af\"\n    }\n  }\n}"
  },
  {
   "title": "Add recipient that is not a tenant user",
   "method": "POST",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7/emailThresholdSettings/recipients/$ref",
   "headers": [
    "If-Match: \"6e1c10bf-3099-4ed4-aff3-0adad4d83f39\"",
    "Content-Type: application/json"
   ],
   "body": "{\n  \"@odata.id\": \"https://graph.microsoft.com/beta/users/00000000-0000-0000-0000-000000000001\"\n}",
   "status": "400 Bad Request",
   "response": "{\n  \"error\": {\n    \"code\": \"alertRecipientNotFound\",\n    \"message\": \"The reference must identify a tenant user.\",\n    \"innerError\": {\n      \"date\": \"2026-10-29T11:05:20\",\n      \"request-id\": \"9729e671-de3f-4815-a254-147234809c5c\",\n      \"client-request-id\": \"9729e671-de3f-4815-a254-147234809c5c\"\n    }\n  }\n}"
  },
  {
   "title": "Remove the last recipient while alerting is enabled",
   "method": "DELETE",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7/emailThresholdSettings/recipients/36bcd5b7-d0eb-420f-a805-84dc9163fae3/$ref",
   "headers": [
    "If-Match: \"0313f531-a0b0-45ce-a139-03684bf17ea4\""
   ],
   "body": null,
   "status": "400 Bad Request",
   "response": "{\n  \"error\": {\n    \"code\": \"alertRecipientsRequired\",\n    \"message\": \"Disable or delete the alert setting before removing its last recipient.\",\n    \"innerError\": {\n      \"date\": \"2026-10-29T11:05:20\",\n      \"request-id\": \"aaf029ee-6f40-482f-a7da-59ddb30f26b1\",\n      \"client-request-id\": \"aaf029ee-6f40-482f-a7da-59ddb30f26b1\"\n    }\n  }\n}"
  },
  {
   "title": "Remove the last assignedGroup (test group A)",
   "method": "DELETE",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7/microsoft.graph.selectedGroupsSpendingPolicy/assignedGroups/18d98985-bc4a-4828-adae-daf58d40fd01/$ref",
   "headers": [
    "If-Match: \"d29c7423-795b-4547-ae28-fb03d980f2fc\""
   ],
   "body": null,
   "status": "409 Conflict",
   "response": "{\n  \"error\": {\n    \"code\": \"lastAssignedGroup\",\n    \"message\": \"The final assigned group cannot be removed from a selected-groups spending policy.\",\n    \"innerError\": {\n      \"date\": \"2026-10-29T11:05:20\",\n      \"request-id\": \"7498b46b-3149-4709-ab1b-bbecda62c95e\",\n      \"client-request-id\": \"7498b46b-3149-4709-ab1b-bbecda62c95e\"\n    }\n  }\n}"
  },
  {
   "title": "Get emailThresholdSettings (before first write)",
   "method": "GET",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7/emailThresholdSettings",
   "headers": [],
   "body": null,
   "status": "404 Not Found",
   "response": "{\n  \"error\": {\n    \"code\": \"notFound\",\n    \"message\": \"The requested resource does not exist.\",\n    \"innerError\": {\n      \"code\": \"emailThresholdSettingsNotFound\",\n      \"date\": \"2026-10-29T11:05:20\",\n      \"request-id\": \"789615f2-47ff-4ecb-a973-31607ead57bf\",\n      \"client-request-id\": \"789615f2-47ff-4ecb-a973-31607ead57bf\"\n    }\n  }\n}"
  },
  {
   "title": "List userBalances collection (documented as not listable)",
   "method": "GET",
   "path": "copilot/costManagement/userBalances",
   "headers": [],
   "body": null,
   "status": "404 Not Found",
   "response": "{\n  \"error\": {\n    \"code\": \"notFound\",\n    \"message\": \"The requested resource does not exist.\",\n    \"innerError\": {\n      \"date\": \"2026-10-29T11:05:20\",\n      \"request-id\": \"9ccd8715-af84-451a-abf3-b091924aa231\",\n      \"client-request-id\": \"9ccd8715-af84-451a-abf3-b091924aa231\"\n    }\n  }\n}"
  },
  {
   "title": "Get spendingPolicy (after delete)",
   "method": "GET",
   "path": "copilot/costManagement/spendingPolicies/af9989b8-f607-45bc-a27b-f8d464e624b7",
   "headers": [],
   "body": null,
   "status": "404 Not Found",
   "response": "{\n  \"error\": {\n    \"code\": \"notFound\",\n    \"message\": \"The requested resource does not exist.\",\n    \"innerError\": {\n      \"code\": \"spendingPolicyNotFound\",\n      \"date\": \"2026-10-29T11:05:20\",\n      \"request-id\": \"918d40dd-3879-41a9-a976-04a3676b52d4\",\n      \"client-request-id\": \"918d40dd-3879-41a9-a976-04a3676b52d4\"\n    }\n  }\n}"
  }
 ]
};
