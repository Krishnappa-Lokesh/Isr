sap.ui.define([
	"psu/isr/Isr/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/base/Log"
], function (BaseController, JSONModel, Log) {
	"use strict";

	return BaseController.extend("psu.isr.Isr.controller.App", {

		onInit: function () {
			var oViewModel,
				fnSetAppNotBusy,
				oListSelector = this.getOwnerComponent().oListSelector,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			oViewModel = new JSONModel({
				busy: true,
				delay: 0,
				itemToSelect: null,
				addEnabled: false,
				//isrDraft: false,
				currentTab: "Header",
				objectPath: "",
				mode: "display",
				//saveBtnPressed: false,
				//itemsCount: 0,
				//racntsCount: 0,
				//sacntsCount: 0,
				isRequestor: false,
				supplierMode: false

			});
			this.setModel(oViewModel, "appView");

			fnSetAppNotBusy = function () {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			this.getOwnerComponent().getModel().metadataLoaded()
				.then(fnSetAppNotBusy);

			// Makes sure that master view is hidden in split app
			// after a new list entry has been selected.
			oListSelector.attachListSelectionChange(function () {
				this.byId("idAppControl").hideMaster();
			}, this);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());


			var oRouter = this.getRouter();
			oRouter.attachBypassed(function (oEvent) {
				var sHash = oEvent.getParameter("hash");
				// do something here, i.e. send logging data to the back end for analysis
				// telling what resource the user tried to access...
				Log.info("Sorry, but the hash '" + sHash + "' is invalid.", "The resource was not found.");
			});
			oRouter.attachRouteMatched(function (oEvent) {
				var sRouteName = oEvent.getParameter("name");
				// do something, i.e. send usage statistics to back end
				// in order to improve our app and the user experience (Build-Measure-Learn cycle)
				Log.info("User accessed route " + sRouteName + ", timestamp = " + new Date().getTime());
			});

		}
	});
});