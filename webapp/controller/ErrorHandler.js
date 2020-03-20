sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageBox",
	"sap/m/MessageToast"

], function (UI5Object, MessageBox, MessageToast) {
	"use strict";

	return UI5Object.extend("psu.isr.Isr.controller.ErrorHandler", {

		/**
		 * Handles application errors by automatically attaching to the model events and displaying errors when needed.
		 * @class
		 * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
		 * @public
		 * @alias psu.isr.Isr.controller.ErrorHandler
		 */
		constructor: function (oComponent) {
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oComponent = oComponent;
			this._oModel = oComponent.getModel();
			this._bMessageOpen = false;
			this._sErrorText = this._oResourceBundle.getText("errorText");

			this._oModel.attachMetadataFailed(function (oEvent) {
				var oParams = oEvent.getParameters();

				this._showMetadataError(oParams.response);
			}, this);

			this._oModel.attachRequestFailed(this.onRequestFailed, this);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event Handler for Request Fail event
		 * The user can try to refresh the metadata.
		 * @param {object} oEvent an event containing the response data
		 * @private
		 */
		onRequestFailed: function (oEvent) {
			var oParams = oEvent.getParameters();

			// An entity that was not found in the service is also throwing a 404 error in oData.
			// We already cover this case with a notFound target so we skip it here.
			// A request that cannot be sent to the server is a technical error that we have to handle though
			if ((oParams.response.statusCode !== "404") || (oParams.response.statusCode === 404 &&
					oParams.response.responseText.indexOf("Cannot POST") === 0)) {
				this._showServiceError(oParams.response);
			}
		},

		/**
		 * Shows a {@link sap.m.MessageBox} when the metadata call has failed.
		 * The user can try to refresh the metadata.
		 * @param {string} sDetails a technical error to be displayed on request
		 * @private
		 */
		_showMetadataError: function (sDetails) {
			MessageBox.error(
				this._sErrorText, {
					id: "metadataErrorMessageBox",
					details: sDetails,
					styleClass: this._oComponent.getContentDensityClass(),
					actions: [MessageBox.Action.RETRY, MessageBox.Action.CLOSE],
					onClose: function (sAction) {
						if (sAction === MessageBox.Action.RETRY) {
							this._oModel.refreshMetadata();
						}
					}.bind(this)
				}
			);
		},

		/**
		 * Shows a {@link sap.m.MessageBox}.
		 * The user can try to refresh the metadata.
		 * @param {string} sTitle the MessageBox title, {string} sMessageHeader and {string} sDetails a technical error to be displayed on request
		 * @private
		 */
		_showErrorMsg: function (sTitle, sMessageHeader, sDetails) {

			MessageBox.error(
				sMessageHeader, {
					id: "ErrorMessageBox",
					title: sTitle,
					details: sDetails,
					icon: MessageBox.Icon.ERROR,
					styleClass: this._oComponent.getContentDensityClass(),
					actions: MessageBox.Action.CLOSE

				}
			);
		},

		/**
		 * Shows a {@link sap.m.MessageBox} when a service call has failed.
		 * Only the first error message will be display.
		 * @param {string} sDetails a technical error to be displayed on request
		 * @private
		 */
		_showServiceError: function (sDetails) {
			if (this._bMessageOpen) {
				return;
			}
			/*			this._bMessageOpen = true;
						MessageBox.error(
							this._sErrorText, {
								id: "serviceErrorMessageBox",
								details: sDetails.responseText,
								styleClass: this._oComponent.getContentDensityClass(),
								actions: [MessageBox.Action.CLOSE],
								onClose: function () {
									this._bMessageOpen = false;
								}.bind(this)
							}
						);
						*/

			this._bMessageOpen = true;
			var aDetails = JSON.parse(sDetails.responseText);

			var that = this;
			
			//var oAppView = this._oComponent.getRootControl().getModel("appView");
			//oAppView.setProperty("/hasPostingError", true);



			MessageBox.error(aDetails["error"].innererror.errordetails[0].message, {
				title: "Funds Reservation error",
				closeOnNavigation: false,
				onClose: function () {
					var oAppViewc = that._oComponent.getRootControl().getModel("appView");
					var oIsrData = that._oModel.getData(oAppViewc.getProperty("/itemToSelect"));
					that._oModel.resetChanges();

					if (oIsrData && oIsrData.Zz1Role === "R") {
						oAppViewc.setProperty("/showSaveButton", !(oIsrData.Zz1USubmit));
						oAppViewc.setProperty("/showCancelButton", !(oIsrData.Zz1USubmit));

					}
					//oAppViewc.setProperty("/hasPostingError", false);

					// oAppView.setProperty("/mode", "display");

					// // Set Applevel Variables
					// oAppView.setProperty("/addEnabled", false);
					// if (oAppView.getProperty("/isRequestor") === true) {
					// 	oAppView.setProperty("/addEnabled", true);
					// }

					// oAppView.setProperty("/showEditButton", !(oIsrData.Zz1USubmit));
					// oAppView.setProperty("/showDeleteButton", !(oIsrData.Zz1USubmit));



					//that._oComponent.getRouter().getTargets().display("object");

					// that._oComponent.getRouter().navTo("object", {
					// 	Zz1Isrno: oIsrData.Zz1Isrno,
					// 	// tabquery: {
					// 		tab: oAppView.getProperty("/currentTab")
					// 	}
					// }, true /*no history*/ );

				}
			});
			this._bMessageOpen = false;

		}
	});

});