//Account is Parent and it's Child -contact(if any field is updated in parent then in child also those fields should be updated
function accountJS(executionContext)
{
	debugger;
	var formContext = executionContext.getFormContext();
	var guid = formContext.data.entity.getId().slice(1, -1); // On load of form get GUID of that current record(example ->account)
	var Phone = formContext.getAttribute("telephone1").getValue(); //getting phone value of that record (in account)
	alert(guid);
	//Getting Contact(Child) records based on the GUID of the Account 
	var req = new XMLHttpRequest();
	req.open("GET", Xrm.Utility.getGlobalContext().getClientUrl() + "/api/data/v9.2/contacts?$select=mobilephone&$filter=_accountid_value eq " + guid + "", true);
	req.setRequestHeader("OData-MaxVersion", "4.0");
	req.setRequestHeader("OData-Version", "4.0");
	req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
	req.setRequestHeader("Accept", "application/json");
	req.setRequestHeader("Prefer", "odata.include-annotations=*");
	req.onreadystatechange = function ()
	{
		if (this.readyState === 4)
		{
			req.onreadystatechange = null;
			if (this.status === 200)
			{
				var results = JSON.parse(this.response);
				console.log(results);
				alert(results.value.length);
				for (var i = 0; i < results.value.length; i++)
				{
					var result = results.value[i];
					// Columns
					var contactid = result["contactid"]; // Guid (GUID of child record)
					//var mobilephone = result["mobilephone"]; // Text(selected column in DRbuilder)
					//------//
					//get update code from the DataverseRB
					var record = {};
					record.mobilephone = Phone; // Text(Setting the dynamic value phone number to child phone field by using Parent field value)
					record.fax = Phone;
					Xrm.WebApi.updateRecord("contact", contactid, record).then(

					function success(result)
					{
						var updatedId = result.id;
						console.log(updatedId);
					},

					function (error)
					{
						console.log(error.message);
					});
				}
				//updating the value in account ent field
				var record = {};
				record.cr03e_childcontactscount = results.value.length; // Whole Number
				Xrm.WebApi.updateRecord("account", guid, record).then(

				function success(result)
				{
					var updatedId = result.id;
					console.log(updatedId);
				},

				function (error)
				{
					console.log(error.message);
				});
			}
			else
			{
				console.log(this.responseText);
			}
		}
	};
	req.send();
}


//Update Parent Field -when child field value is updated
function updateParent(executionContext)
{
	debugger;
	var formContext = executionContext.getFormContext();
	var guid = formContext.data.entity.getId().slice(1, -1);
	alert(guid);
	var fax_value = formContext.getAttribute("fax").getValue();
	var accountlookup = formContext.getAttribute("parentcustomerid").getValue()[0].id.slice(1, -1);
	var record = {};
	record.sic = fax_value; // Text
	Xrm.WebApi.updateRecord("account", accountlookup, record).then(

	function success(result)
	{
		var updatedId = result.id;
		console.log(updatedId);
	},

	function (error)
	{
		console.log(error.message);
	});
}


//When lead is created with name , account name ->create account , contact and also opportunity
function createOpport(executionContext)
{
	debugger;
	var formContext = executionContext.getFormContext();
	var yes_no = formContext.getAttribute("dp_createaopportunity").getValue();
	if (yes_no == 1)
	{
		var first = formContext.getAttribute("firstname").getValue();
		var last = formContext.getAttribute("lastname").getValue();
		var cmpny = formContext.getAttribute("companyname").getValue();
		var email = formContext.getAttribute("emailaddress1").getValue();
		// Contact creation
		var contactRecord = {};
		contactRecord.lastname = last;
		contactRecord.firstname = first;
		contactRecord.emailaddress1 = email;
		Xrm.WebApi.createRecord("contact", contactRecord).then(

		function success(result)
		{
			var contactId = result.id;
			console.log("Contact created with ID:", contactId);
			// Account creation
			var accountRecord = {};
			accountRecord.name = cmpny;
			Xrm.WebApi.createRecord("account", accountRecord).then(

			function success(result)
			{
				var accntId = result.id;
				console.log("Account created with ID:", accntId);
				// Opportunity creation
				var oppRecord = {};
				oppRecord["parentaccountid@odata.bind"] = "/accounts(" + accntId + ")"; // Lookup
				oppRecord["parentcontactid@odata.bind"] = "/contacts(" + contactId + ")"; // Lookup
				oppRecord.name = "Sample"; // Text
				Xrm.WebApi.createRecord("opportunity", oppRecord).then(

				function success(result)
				{
					var oppId = result.id;
					Xrm.Utility.openEntityForm("opportunity", oppId);
					console.log("Opportunity created with ID:", oppId);
				},

				function (error)
				{
					console.log("Error creating opportunity:", error.message);
				});
			},

			function (error)
			{
				console.log("Error creating account:", error.message);
			});
		},

		function (error)
		{
			console.log("Error creating contact:", error.message);
		});
	}
}


//On invoice entity alert when there is change in manual discount in Order entity
function invoiceDiscount(executionContext) {
    debugger;
    var formContext = executionContext.getFormContext();
    var invoiceId = formContext.data.entity.getId().slice(1, -1);

    // Retrieve the invoice record
    Xrm.WebApi.retrieveRecord("invoice", invoiceId, "?$select=invoiceid,_salesorderid_value").then(
        function success(invoiceResult) {
            console.log(invoiceResult);
            var salesorderGuid = invoiceResult["_salesorderid_value"]; //GUID of the order record

            // Retrieve the sales order record
            Xrm.WebApi.retrieveRecord("salesorder", salesorderGuid, "?$select=salesorderid,_quoteid_value&$expand=order_details($select=manualdiscountamount)").then(
                function success(salesOrderResult) {
                    console.log(salesOrderResult);

                    // Iterate through the order details to get the manual discount amounts
                    for (var j = 0; j < salesOrderResult.order_details.length; j++) {
                        var order_details_manualdiscountamount = salesOrderResult.order_details[j]["manualdiscountamount"]; // Currency
                        alert(order_details_manualdiscountamount);
                    }
                },
                function (error) {
                    console.log(error.message);
                }
            );
        },
        function (error) {
            console.log(error.message);
        }
    );
}
