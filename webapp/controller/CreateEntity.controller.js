sap.ui.define([
	"psu/isr/Isr/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/message/Message",
	"sap/ui/core/MessageType",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController,
	JSONModel,
	Message,
	MessageType,
	MessageBox,
	MessageToast,
	Filter,
	FilterOperator) {
	"use strict";
	return BaseController.extend("psu.isr.Isr.controller.CreateEntity", {
		_oBinding: {},
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		onInit: function () {
			var that = this;
			this.getRouter().getTargets().getTarget("create").attachDisplay(null, this._onDisplay, this);
			this._oODataModel = this.getOwnerComponent().getModel();
			this._oResourceBundle = this.getResourceBundle();
			this._oViewModel = new JSONModel({
				enableCreate: false,
				delay: 0,
				busy: false,
				viewTitle: "",
				bHasErrors: false
			});
			this.setModel(this._oViewModel, "viewModel");

			// Register the view with the message manager
			sap.ui.getCore().getMessageManager().registerObject(this.getView(), true);
			var oMessagesModel = sap.ui.getCore().getMessageManager().getMessageModel();
			this._oBinding = new sap.ui.model.Binding(oMessagesModel, "/", oMessagesModel.getContext("/"));
			this._oBinding.attachChange(function (oEvent) {
				var aMessages = oEvent.getSource().getModel().getData();
				for (var i = 0; i < aMessages.length; i++) {
					if (aMessages[i].type === "Error" && !aMessages[i].technical) {
						that._oViewModel.setProperty("/enableCreate", false);
					}
				}
			});
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		/**
		 * Event handler (attached declaratively) for the view save button. Saves the changes added by the user. 
		 * @function
		 * @public
		 */
		onSave: function (oEvent) {

			var oView = this.getView();
			var sPath = oView.getBindingContext().sPath;
			var sCurrentTab = this.getView().byId(sap.ui.core.Fragment.createId("frgIsrForm", "idIconTabBarFiori2")).getSelectedKey();

			var that = this,
				oModel = this.getModel();

			if (sCurrentTab === "SerComp") {
				if (oModel.getProperty(sPath + "/Zz1Scomplete") === false) {
					if (oModel.getProperty(sPath + "/Zz1NotesC") === "") {

						MessageToast.show("Please enter Notes ");

						/*					
							var oMessage = new Message({
							code: "ZFICO",
							message: "Please enter Notes ",
							type: MessageType.Error,
							target: "/Dummy",
							processer: this.getView().getModel()

						});
						sap.ui.getCore().getMessageManager().addMessages(oMessage);
						*/

						return;
					}
				} else {
					if (oModel.getProperty(sPath + "/Zz1Sinvnmbr") === "") {
						MessageToast.show("Please enter Supplier Invoice Number ");
						return;
					}
					if (oModel.getProperty(sPath + "/Zz1Billrefinfo") === "") {
						MessageToast.show("Please enter Billing Reference Number ");
						return;
					}

				}

				var sMessageText = this._oResourceBundle.getText("supplierClsNConfirmMesage");
				if (oModel.getProperty(sPath + "/Zz1Scomplete") === true) {
					sMessageText = this._oResourceBundle.getText("supplierClsYConfirmMesage");
				}

				MessageBox.confirm(sMessageText, {
					styleClass: this.getOwnerComponent().getContentDensityClass(),
					onClose: function (oAction) {

						// Check user action
						if (oAction === sap.m.MessageBox.Action.OK) {
							var sPathMb = that.getView().getBindingContext().getPath();
							that.getModel().setProperty(sPathMb + "/Zz1UScmplte", true);

							that.getModel('viewModel').setProperty('bHasErrors', false);
							that._handleSave();
						} else {
							that.getModel('viewModel').setProperty('bHasErrors', true);
							//that._oODataModel.resetChanges();
							//that._navBack();
						}
					}
				});

			} else if (sCurrentTab === "Racnts") {

				this.onSubmitforApproval();
			} else {

				// abort if the  model has not been changed
				if (!oModel.hasPendingChanges()) {
					MessageBox.information(this._oResourceBundle.getText("noChangesMessage"), {
						id: "noChangesInfoMessageBox",
						styleClass: that.getOwnerComponent().getContentDensityClass()
					});
					return;
				}

				this.getModel('viewModel').setProperty('bHasErrors', false);
				sap.ui.getCore().getMessageManager().removeAllMessages();

				var nRaccTotal = oModel.getProperty(sPath + "/Zz1RaccTotal") * 1;
				var nSaccTotal = oModel.getProperty(sPath + "/Zz1SaccTotal") * 1;

				if (oModel.getProperty(sPath + "/Zz1ESacc") === true &&
					nSaccTotal !== nRaccTotal) {

					MessageBox.confirm(this._oResourceBundle.getText("supplierAmtDiffMesage"), {
						styleClass: this.getOwnerComponent().getContentDensityClass(),
						onClose: function (oAction) {

							// Check user action
							if (oAction === sap.m.MessageBox.Action.OK) {
								that.getModel('viewModel').setProperty('bHasErrors', false);
								that._handleSave();
							} else {
								that.getModel('viewModel').setProperty('bHasErrors', true);
								//that._oODataModel.resetChanges();
								//that._navBack();
							}
						}
					});

				} else {

					this._handleSave();
				}

			}
		},

		onSubmitforApproval: function (oEvent) {

			var that = this,
				oModel = this.getModel();

			this.getModel('viewModel').setProperty('bHasErrors', false);
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var oView = this.getView();
			var sPath = oView.getBindingContext().sPath;

			var nItmsTotal = oModel.getProperty(sPath + "/Zz1ItmsTotal") * 1;
			var nRaccTotal = oModel.getProperty(sPath + "/Zz1RaccTotal") * 1;

			if (nItmsTotal === nRaccTotal) {

				MessageBox.confirm(this._oResourceBundle.getText("submitConfirmationMesage"), {
					styleClass: this.getOwnerComponent().getContentDensityClass(),
					onClose: function (oAction) {

						// Check User action
						if (oAction === sap.m.MessageBox.Action.OK) {

							var sPathMb = that.getView().getBindingContext().getPath();
							that.getModel().setProperty(sPathMb + "/Zz1USubmit", true);

							that.getModel('viewModel').setProperty('bHasErrors', false);
							that._handleSave();

						}
					}
				});

			} else {

				MessageToast.show("Item Total and Account Total Not Equal, Please Correct");
			}

		},

		_handleSave: function (oEvent) {

			var that = this,
				oModel = this.getModel();
			var oView = this.getView();
			var sPath = oView.getBindingContext().sPath;
			var oAppView = this.getModel("appView");

			if (this.getModel('viewModel').getProperty('bHasErrors') === true) {
				return;
			}

			if (oModel.getProperty(sPath + "/Zz1EScmplte") === true && oModel.getProperty(sPath + "/Zz1Scomplete") === true) {
				var sPathMb = this.getView().getBindingContext().getPath();
				this.getModel().setProperty(sPathMb + "/Zz1UScmplte", true);
			}

			oAppView.setProperty("/busy", true);
			oAppView.setProperty("/addingItems", false);

			// Set Applevel Variables
			oAppView.setProperty("/addEnabled", false);
			if (oAppView.getProperty("/isRequestor") === true) {
				oAppView.setProperty("/addEnabled", true);
			}

			oAppView.setProperty("/showEditButton", !(oModel.getProperty(sPath + "/Zz1USubmit")));
			oAppView.setProperty("/showDeleteButton", !(oModel.getProperty(sPath + "/Zz1USubmit")));

			if (oAppView.getProperty("/mode") === "edit") {

				oAppView.setProperty("/mode", "display");

				// attach to the request completed event of the batch
				oModel.attachEventOnce("batchRequestCompleted", function (obrEvent) {
					if (that._checkIfBatchRequestSucceeded(obrEvent)) {
						that._fnUpdateSuccess();
					} else {
						that._fnEntityCreationFailed();
						//MessageBox.error(that._oResourceBundle.getText("updateError"));
					}
				});
			}

			oModel.submitChanges({
					// Success Message
					success: function () {
						MessageToast.show("Data Saved");

						that.getModel("appView").setProperty("/busy", false);
						//that.setViewDataChanged(false);

					}

				}, {
					//Error Message
					error: function () {
						MessageToast.show("Error updating record");
					}
				}

			);
		},

		_checkIfBatchRequestSucceeded: function (oEvent) {
			var oParams = oEvent.getParameters();
			var aRequests = oEvent.getParameters().requests;
			var oRequest;
			if (oParams.success) {
				if (aRequests) {
					for (var i = 0; i < aRequests.length; i++) {
						oRequest = oEvent.getParameters().requests[i];
						if (!oRequest.success) {
							return false;
						}
					}
				}
				return true;
			} else {
				return false;
			}
		},
		/**
		 * Event handler (attached declaratively) for the view cancel button. Asks the user confirmation to discard the changes. 
		 * @function
		 * @public
		 */
		onCancel: function () {
			// check if the model has been changed
			if (this.getModel().hasPendingChanges()) {
				// get user confirmation first
				this._showConfirmQuitChanges(); // some other thing here....
			} else {

				sap.ui.getCore().getMessageManager().removeAllMessages();
				this.getModel("appView").setProperty("/mode", "display");

				this.getModel("appView").setProperty("/addEnabled", false);
				if (this.getModel("appView").getProperty("/isRequestor") === true) {
					this.getModel("appView").setProperty("/addEnabled", true);
				}

				// cancel without confirmation
				this._navBack();
			}
		},

		onChangeSwitch: function (oEvent) {
			var aInputControls = this._getFormFields(this.byId(sap.ui.core.Fragment.createId("frgIsrForm", "serviceAcceptanceSimpleForm")));
			var oControl;
			for (var m = 0; m < aInputControls.length; m++) {
				oControl = aInputControls[m].control;
				if (aInputControls[m].required) {
					var sValue = oControl.getValue();
					if (!sValue) {
						this._oViewModel.setProperty("/enableCreate", false);
						return;
					}
				}
			}
			this._checkForErrorMessages();

		},
		/* =========================================================== */
		/* Internal functions
		/* =========================================================== */
		/**
		 * Handles the onDisplay event which is triggered when this view is displayed 
		 * @param {sap.ui.base.Event} oEvent the on display event
		 * @private
		 */
		_onDisplay: function (oEvent) {
			var oData = oEvent.getParameter("data");
			if (oData && oData.mode === "update") {
				this._onEdit(oEvent);
			} else {
				//if (!this.getModel().hasPendingChanges()) {
				this._onCreate(oEvent);
				//} else {
				//	this._onEdit(oEvent);
				//}
			}
		},
		/**
		 * Prepares the view for editing the selected object
		 * @param {sap.ui.base.Event} oEvent the  display event
		 * @private
		 */
		_onEdit: function (oEvent) {

			var oAppViewModel = this.getModel("appView"),
				sSelectedTabKey = oAppViewModel.getProperty("/currentTab");

			var oView = this.getView();

			if (oEvent.getParameter("data").objectPath) {
				var sPath = oEvent.getParameter("data").objectPath;
			} else {
				sPath = oView.getBindingContext().getPath();
			}

			var oObject = oView.getModel().getObject(sPath);

			//--- enable Edit mode
			oAppViewModel.setProperty("/mode", "edit");
			oAppViewModel.setProperty("/addEnabled", false);
			oAppViewModel.setProperty("/supplierMode", false);
			

			//--- Supplier Mode - only Supplier tabs are open for editing
			if (oObject.Zz1ESacc) {
				oAppViewModel.setProperty("/supplierMode", true);
			}

			this._oViewModel.setProperty("/enableCreate", true);
			this._oViewModel.setProperty("/viewTitle", this._oResourceBundle.getText("editViewTitle"));
			oView.bindElement({
				path: sPath
			});
			oView.byId(sap.ui.core.Fragment.createId("frgIsrForm", "idIconTabBarFiori2")).setSelectedKey(sSelectedTabKey);

			oAppViewModel.setProperty("/showSaveButton", false);
			oAppViewModel.setProperty("/showCancelButton", true);

			if (sSelectedTabKey === 'Header' ||
				sSelectedTabKey === 'Items' ||
				sSelectedTabKey === 'Racnts'
				//sSelectedTabKey === 'Seracpt' 
			) {

				if (oObject && oObject.Zz1Role === "R") {
					oAppViewModel.setProperty("/showSaveButton", !(oObject.Zz1USubmit));
					oAppViewModel.setProperty("/showCancelButton", !(oObject.Zz1USubmit));
				}
			}

			if (sSelectedTabKey === 'Sacnts' ||
				sSelectedTabKey === 'SerComp') {

				if (oObject.Zz1USubmit === true && oObject.Zz1UScmplte === false) {
					oAppViewModel.setProperty("/showSaveButton", true);
				} else {
					oAppViewModel.setProperty("/showSaveButton", false);
				}

			}

			var oSaveBtn = oView.byId("semntcBtnSave");
			oSaveBtn.getAggregation("_control").setText("Save"); // Default Save

			if (sSelectedTabKey === "SerComp" && oObject.Zz1EScmplte === true) {

				//---  Update the button text  to  'Close ISR'
				if (oObject.Zz1SaccTotal > 0) {
					oSaveBtn.getAggregation("_control").setText("Close ISR");
					this._oViewModel.setProperty("/enableCreate", true);
				}

			} else if (sSelectedTabKey === "Racnts") {

				//---  Update the button text  to  "Submit for Approval"
				if (oObject.Zz1ItmsTotal === oObject.Zz1RaccTotal) {
					oSaveBtn.getAggregation("_control").setText("Submit for Approval");
				}

			}
			

		},
		/**
		 * Prepares the view for creating new object
		 * @param {sap.ui.base.Event} oEvent the  display event
		 * @private
		 */
		_onCreate: function (oEvent) {
			if (oEvent.getParameter("name") && oEvent.getParameter("name") !== "create") {
				//this._oViewModel.setProperty("/enableCreate", false);
				this.getRouter().getTargets().detachDisplay(null, this._onDisplay, this);
				this.getView().unbindObject();
				return;
			}

			//this._oViewModel.setProperty("/mode", "create");
			var oAppViewModel = this.getModel("appView");
			oAppViewModel.setProperty("/mode", "edit");
			oAppViewModel.setProperty("/supplierMode", false);

			oAppViewModel.setProperty("/addEnabled", false);

			this._oViewModel.setProperty("/viewTitle", this._oResourceBundle.getText("createViewTitle"));

			// Navigate to Header tab
			var oView = this.getView();
			//oView.byId(sap.ui.core.Fragment.createId("frgIsrForm", "idIconTabBarFiori2")).setSelectedKey(
			//	"Header");
			oView.byId(sap.ui.core.Fragment.createId("frgIsrForm", "idIconTabBarFiori2")).setSelectedKey(
				oAppViewModel.getProperty("/currentTab"));

			//oAppViewModel.getProperty("/currentTab");	

			var oBackEndData = this._oODataModel.oData;
			for (var key in oBackEndData) {
				if (oBackEndData.hasOwnProperty(key)) {
					if (key.substr(0, 7) === 'IsrUser') {
						var oUser = oBackEndData[key];
						break;
					}
				}
			}

			sap.ui.getCore().getMessageManager().removeAllMessages();

			var oContext = this._oODataModel.createEntry("IsrHeaderSet", {
				properties: {
					Zz1Isrno: "new",
					Zz1Sapid: oUser.Zz1Sapid,
					Zz1UserName: oUser.Zz1UserName,
					Zz1Saccept: false,
					Zz1Scomplete: false,
					Zz1EItems: false,
					Zz1ERacc: false,
					Zz1ESacpt: false,
					Zz1ESacc: false,
					Zz1EScmplte: false,
					Zz1USubmit: false,
					Zz1UScmplte: false,
					Zz1ItmsTotal: "0.00",
					Zz1RaccTotal: "0.00",
					Zz1SaccTotal: "0.00"

				},
				success: this._fnEntityCreated.bind(this),
				error: this._fnEntityCreationFailed.bind(this)
			});
			this.getView().setBindingContext(oContext);

			var oSaveBtn = oView.byId("semntcBtnSave");
			oSaveBtn.getAggregation("_control").setText("Save"); // Default Save

		},
		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to the Details page
		 * @private
		 */
		_navBack: function () {
			// var oHistory = sap.ui.core.routing.History.getInstance(),
			// 	sPreviousHash = oHistory.getPreviousHash();

			this.getView().unbindObject();
			// if (sPreviousHash !== undefined) {
			// 	// The history contains a previous entry
			// 	history.go(-1);
			// } else {
				this.getRouter().getTargets().display("object");

				// var sPath = this.getView().getBindingContext().getPath();
				// var sIsrNo = this.getModel().getProperty(sPath + '/Zz1Isrno');
				// this.getRouter().navTo("object", {
				//  	Zz1Isrno: sIsrNo
				//  }, true);

			//}
		},
		/**
		 * Opens a dialog letting the user either confirm or cancel the quit and discard of changes.
		 * @private
		 */
		_showConfirmQuitChanges: function () {
			var oComponent = this.getOwnerComponent(),
				oModel = this.getModel();
			var that = this;
			MessageBox.confirm(this._oResourceBundle.getText("confirmCancelMessage"), {
				styleClass: oComponent.getContentDensityClass(),
				onClose: function (oAction) {
					if (oAction === sap.m.MessageBox.Action.OK) {
						that.getModel("appView").setProperty("/addEnabled", false);
						if (that.getModel("appView").getProperty("/isRequestor") === true) {
							that.getModel("appView").setProperty("/addEnabled", true);
						}
						that.getModel("appView").setProperty("/mode", "display");
						oModel.resetChanges();
						that._navBack();
					}
				}
			});
		},
		/**
		 * Checks if the save button can be enabled
		 * @private
		 */
		_validateSaveEnablement: function () {
			var aInputControls = this._getFormFields(this.byId(sap.ui.core.Fragment.createId("frgIsrForm", "newEntitySimpleForm")));
			var oControl;
			for (var m = 0; m < aInputControls.length; m++) {
				oControl = aInputControls[m].control;
				if (aInputControls[m].required) {
					var sValue = oControl.getValue();
					if (!sValue) {
						this._oViewModel.setProperty("/enableCreate", false);
						return;
					}
				}
			}
			this._checkForErrorMessages();
		},
		_validateSaveEnablementItems: function (oEvent) {

			var aItems = this.getView().byId(sap.ui.core.Fragment.createId("frgIsrForm", "itemTable")).getItems();
			var oModel = this.getModel();
			var oViewModel = this.getModel("viewModel");

			// -- Calculate Total
			oViewModel.grandTotal = 0;
			for (var lineItem in aItems) {
				var sPath = aItems[lineItem].getBindingContext().sPath;
				var oLineItem = oModel.getProperty(aItems[lineItem].getBindingContext().sPath);
				var nLineItemTotal = oLineItem.Zz1Quantity * oLineItem.Zz1Unitprice;
				oViewModel.grandTotal += oLineItem.Zz1Quantity * oLineItem.Zz1Unitprice;

				oLineItem.Zz1Total = nLineItemTotal.toString();
				oModel.setProperty(sPath + "/Zz1Total", oLineItem.Zz1Total);
			}
			
			//-- update header total
			var sHeaderPath = this.getView().getBindingContext().sPath;
			oModel.setProperty(sHeaderPath + "/Zz1ItmsTotal", oViewModel.grandTotal.toString());
			oModel.setProperty(sHeaderPath + "/Zz1CItems", aItems.length.toString());


			//-- Validate Fields			
			for (var tableLineItem in aItems) {

				//-- When Line item total is zero disable save button
				if (nLineItemTotal === 0) {
					this._oViewModel.setProperty("/enableCreate", false);
					return;
				}

				var aCells = aItems[tableLineItem].getCells();
				for (var nFieldControl in aCells) {
					if (aCells[nFieldControl].getId().search("inZz1Uom") > 0) {
						if (aCells[nFieldControl].getValueState() === "Error") {
							this._oViewModel.setProperty("/enableCreate", false);
							return;
						}
					}
				}

			}

			var aInputControls = this._getFormFields(this.byId(sap.ui.core.Fragment.createId("frgIsrForm", "newEntitySimpleForm")));
			var oControl;
			for (var m = 0; m < aInputControls.length; m++) {
				oControl = aInputControls[m].control;
				if (aInputControls[m].required) {
					var sValue = oControl.getValue();
					if (!sValue) {
						this._oViewModel.setProperty("/enableCreate", false);
						return;
					}
				}
			}

			this._checkForErrorMessages();
		},

		_validateSaveEnablementRacnts: function () {

			var aItems = this.getView().byId(sap.ui.core.Fragment.createId("frgIsrForm", "racntsTable")).getItems();
			var oModel = this.getModel();
			var oViewModel = this.getModel("viewModel");

			//-- Calculate total
			oViewModel.racntTotal = 0;
			for (var lineItem in aItems) {
				var oLineItem = oModel.getProperty(aItems[lineItem].getBindingContext().sPath);
				var nLineItemTotal = oLineItem.Zz1Ramtcobj * 1;
				oViewModel.racntTotal += nLineItemTotal;

			}
			//--------- update header total
			var sHeaderPath = this.getView().getBindingContext().sPath;
			oModel.setProperty(sHeaderPath + "/Zz1RaccTotal", oViewModel.racntTotal.toString());
			oModel.setProperty(sHeaderPath + "/Zz1CRaccs", aItems.length.toString());
			


			//-- Validate Fields
			for (var tableLineItem in aItems) {
				//---  Check if CC, IO or WBS  has value
				if (oLineItem.Zz1Reqcc === "" && oLineItem.Zz1Reqio === "" && oLineItem.Zz1Reqwbs === "") {
					this._oViewModel.setProperty("/enableCreate", false);
					return;
				}

				//--- Check Amount > 0
				if (nLineItemTotal === 0) {
					this._oViewModel.setProperty("/enableCreate", false);
					return;
				}

				//--- Check Required fields
				var aInputControls = this._getTableFields(aItems[tableLineItem]);
				var oControl;
				for (var m = 0; m < aInputControls.length; m++) {
					oControl = aInputControls[m].control;
					if (aInputControls[m].required) {
						var sValue = oControl.getValue();
						if (!sValue) {
							this._oViewModel.setProperty("/enableCreate", false);
							return;
						}
					}
				}

			}


			this._checkForErrorMessages();

			//---  Update the button text  to  "Submit for Approval"
			var oSaveBtn = this.getView().byId("semntcBtnSave");
			oSaveBtn.getAggregation("_control").setText("Save"); // Default Save

			var nItemsTotal = oModel.getProperty(sHeaderPath + "/Zz1ItmsTotal") * 1;
			var nRaccTotal = oModel.getProperty(sHeaderPath + "/Zz1RaccTotal") * 1;
			if (nItemsTotal === nRaccTotal) {
				oSaveBtn.getAggregation("_control").setText("Submit for Approval");
			}

		},

		_validateSaveEnablementSacnts: function () {

			var aItems = this.getView().byId(sap.ui.core.Fragment.createId("frgIsrForm", "sacntsTable")).getItems();
			var oModel = this.getModel();
			var oViewModel = this.getModel("viewModel");
			oViewModel.sacntTotal = 0;

			//-- Calculate Total
			for (var lineItem in aItems) {
				//var sPath = aItems[tableLineItem].getBindingContext().sPath;
				var oLineItem = oModel.getProperty(aItems[lineItem].getBindingContext().sPath);
				var nLineItemTotal = oLineItem.Zz1Samtcobj * 1;
				oViewModel.sacntTotal += nLineItemTotal;
			}

			//-- update header total
			var sHeaderPath = this.getView().getBindingContext().sPath;
			oModel.setProperty(sHeaderPath + "/Zz1SaccTotal", oViewModel.sacntTotal.toString());
			oModel.setProperty(sHeaderPath + "/Zz1CSaccs", aItems.length.toString());


			// -- Validate Fields
			for (var tableLineItem in aItems) {

				//  Check if CC, IO or WBS  has value
				if (oLineItem.Zz1Supcc === "" && oLineItem.Zz1Supio === "" && oLineItem.Zz1Supwbs === "") {
					this._oViewModel.setProperty("/enableCreate", false);
					return;
				}

				//--- Check Amount > 0
				if (nLineItemTotal === 0) {
					this._oViewModel.setProperty("/enableCreate", false);
					return;
				}

				//--- Check Required fields
				var aInputControls = this._getTableFields(aItems[tableLineItem]);
				var oControl;
				for (var m = 0; m < aInputControls.length; m++) {
					oControl = aInputControls[m].control;
					if (aInputControls[m].required) {
						var sValue = oControl.getValue();
						if (!sValue) {
							this._oViewModel.setProperty("/enableCreate", false);
							return;
						}
					}
				}

			}

			this._checkForErrorMessages();
		},

		/**
		 * Checks if there is any wrong inputs that can not be saved.
		 * @private
		 */
		_checkForErrorMessages: function () {
			var aMessages = this._oBinding.oModel.oData;
			if (aMessages.length > 0) {
				var bEnableCreate = true;
				for (var i = 0; i < aMessages.length; i++) {

					if (typeof (aMessages[i].code) !== 'undefined') {
						if (!aMessages[i].code.includes("ZFICO")) {

							if (aMessages[i].type === "Error" && !aMessages[i].technical) {
								bEnableCreate = false;
								break;
							}
						}
					}
				}
				this._oViewModel.setProperty("/enableCreate", bEnableCreate);
			} else {
				this._oViewModel.setProperty("/enableCreate", true);
			}
		},
		/**
		 * Handles the success of creating an object
		 *@param {object} oData the response of the save action
		 * @private
		 */
		_fnEntityCreated: function (oData) {
			var sObjectPath = this.getModel().createKey("IsrHeaderSet", oData);

			//save last created
			var oAppViewModel = this.getModel("appView");
			oAppViewModel.setProperty("/itemToSelect", "/" + sObjectPath);
			oAppViewModel.setProperty("/busy", false);
			oAppViewModel.setProperty("/mode", "display");

			this.getRouter().getTargets().display("object");
		},
		/**
		 * Handles the success of updating an object
		 * @private
		 */
		_fnUpdateSuccess: function () {
			//var sObjectPath = this.getView().getElementBinding().getPath();
			var sObjectPath = this.getView().getBindingContext().getPath();

			var oAppViewModel = this.getModel("appView");
			oAppViewModel.setProperty("/busy", false);
			oAppViewModel.setProperty("/itemToSelect", sObjectPath);
			oAppViewModel.setProperty("/mode", "display");

			this.getView().unbindObject();
			this._navBack();

			//this.getRouter().getTargets().display("object");

			//var sIsrNo = this.getView().getBindingContext().getProperty("Zz1Isrno");
			//this.getView().unbindObject();
			//this.getRouter().navTo("object", {
			//	Zz1Isrno: encodeURIComponent(sIsrNo)
			//}, true);

		},
		/**
		 * Handles the failure of creating/updating an object
		 * @private
		 */
		_fnEntityCreationFailed: function () {
			this.getModel("appView").setProperty("/busy", false);
		},
		/**
		 * Gets the form fields
		 * @param {sap.ui.layout.form} oSimpleForm the form in the view.
		 * @private
		 */
		_getFormFields: function (oSimpleForm) {
			var aControls = [];
			var aFormContent = oSimpleForm.getContent();
			var sControlType;
			for (var i = 0; i < aFormContent.length; i++) {
				sControlType = aFormContent[i].getMetadata().getName();
				if (sControlType === "sap.m.Input" || sControlType === "sap.m.DateTimeInput" || sControlType === "sap.m.CheckBox") {
					aControls.push({
						control: aFormContent[i],
						required: aFormContent[i - 1].getRequired && aFormContent[i - 1].getRequired()
					});
				}
			}
			return aControls;
		},
		/**
		 * Gets the Mandatory Table fields
		 */
		_getTableFields: function (oTable) {
			var aControls = [];
			var aItems = oTable.getCells();
			var sControlType;
			for (var i = 0; i < aItems.length; i++) {
				sControlType = aItems[i].getMetadata().getName();
				if (sControlType === "sap.m.Input" || sControlType === "sap.m.DateTimeInput" || sControlType === "sap.m.CheckBox") {
					aControls.push({
						control: aItems[i],
						required: aItems[i].getRequired && aItems[i].getRequired()
					});
				}
			}
			return aControls;
		},

		handleValueHelp: function (oEvent) {
			var sPath = this.getView().getBindingContext().getPath();
			var oObject = this.getModel().getObject(sPath);
			var currentTab = this.getView().byId(sap.ui.core.Fragment.createId("frgIsrForm", "idIconTabBarFiori2")).getSelectedKey();

			var sInputValue = oEvent.getSource().getValue();
			var aDialogs = {
				"Zz1Sapid_id": "psu.isr.Isr.view.UserNameDialog",
				"Zz1Rdept_id": "psu.isr.Isr.view.DepartmentDialog",
				"Zz1Sdept_id": "psu.isr.Isr.view.DepartmentDialog",
				"Zz1Rglacct_id": "psu.isr.Isr.view.GlAccountDialog",
				"Zz1Reqcc_id": "psu.isr.Isr.view.CostCenterDialog",
				"Zz1Reqio_id": "psu.isr.Isr.view.IOrderDialog",
				"Zz1Reqwbs_id": "psu.isr.Isr.view.WbsDialog",
				"Zz1Sglacct_id": "psu.isr.Isr.view.GlAccountDialog",
				"Zz1Supcc_id": "psu.isr.Isr.view.CostCenterDialog",
				"Zz1Supio_id": "psu.isr.Isr.view.IOrderDialog",
				"Zz1Supwbs_id": "psu.isr.Isr.view.WbsDialog"
			};
			var aFieldName = {
				"Zz1Sapid_id": "Bname",
				"Zz1Rdept_id": "Dept",
				"Zz1Sdept_id": "Dept",
				"Zz1Rglacct_id": "Saknr",
				"Zz1Reqcc_id": "Kostl",
				"Zz1Reqio_id": "Aufnr",
				"Zz1Reqwbs_id": "Posid",
				"Zz1Sglacct_id": "Saknr",
				"Zz1Supcc_id": "Kostl",
				"Zz1Supio_id": "Aufnr",
				"Zz1Supwbs_id": "Posid"

			};
			this.oSourceField = oEvent.getSource();
			this.inputId = oEvent.getSource().getName();
			this.dialogModule = aDialogs[this.inputId];

			this.filterFieldName = aFieldName[this.inputId];

			if (this.filterFieldName === "Bname") {
				// create value help dialog
				if (!this._valueHelpDialogUserNames) {
					this._valueHelpDialogUserNames = sap.ui.xmlfragment(this.dialogModule, this);
					this.getView().addDependent(this._valueHelpDialogUserNames);
				}
				// create a filter for the binding
				this._valueHelpDialogUserNames.getBinding("items").filter([new Filter(this.filterFieldName, sap.ui.model.FilterOperator.Contains,
					sInputValue)]);
				// open value help dialog filtered by the input value
				this._valueHelpDialogUserNames.open(sInputValue);
			} else if (this.filterFieldName === "Dept") {
				// create value help dialog
				if (!this._valueHelpDialogDepartment) {
					this._valueHelpDialogDepartment = sap.ui.xmlfragment(this.dialogModule, this);
					this.getView().addDependent(this._valueHelpDialogDepartment);
				}
				// create a filter for the binding
				this._valueHelpDialogDepartment.getBinding("items").filter([
					new Filter("Kostl", sap.ui.model.FilterOperator.Contains, sInputValue)
				]);
				// open value help dialog filtered by the input value
				this._valueHelpDialogDepartment.open(sInputValue);
			} else if (this.filterFieldName === "Kostl") {
				// create value help dialog
				if (!this._valueHelpDialogCostCenter) {
					this._valueHelpDialogCostCenter = sap.ui.xmlfragment(this.dialogModule, this);
					this.getView().addDependent(this._valueHelpDialogCostCenter);
				}
				// create a filter for the binding
				/*				if (sInputValue === '') {
									if (currentTab === 'Racnts') {
										sInputValue = oObject.Zz1Rdept.substr(0, 5);
									} else {
										sInputValue = oObject.Zz1Sdept.substr(0, 5);
									}
								}
				*/
				this._valueHelpDialogCostCenter.getBinding("items").filter([
					new Filter(this.filterFieldName, sap.ui.model.FilterOperator.Contains,
						sInputValue)
				]);

				// open value help dialog filtered by the input value
				this._valueHelpDialogCostCenter.open(sInputValue);
			} else if (this.filterFieldName === "Saknr") {
				// create value help dialog
				if (!this._valueHelpDialogGlAccount) {
					this._valueHelpDialogGlAccount = sap.ui.xmlfragment(this.dialogModule, this);
					this.getView().addDependent(this._valueHelpDialogGlAccount);
				}
				// create a filter for the binding
				this._valueHelpDialogGlAccount.getBinding("items").filter([
					new Filter(this.filterFieldName, sap.ui.model.FilterOperator.Contains,
						sInputValue)
				]);

				// open value help dialog filtered by the input value
				this._valueHelpDialogGlAccount.open(sInputValue);
			} else if (this.filterFieldName === "Aufnr") {
				// create value help dialog
				if (!this._valueHelpDialogIOrder) {
					this._valueHelpDialogIOrder = sap.ui.xmlfragment(this.dialogModule, this);
					this.getView().addDependent(this._valueHelpDialogIOrder);
				}
				// create a filter for the binding
				/*				if (sInputValue === '') {
									var sKostv = '';
									if (currentTab === 'Racnts') {
										sKostv = oObject.Zz1Rdept.substr(0, 5);
									} else {
										sKostv = oObject.Zz1Sdept.substr(0, 5);
									}

									this._valueHelpDialogIOrder.getBinding("items").filter([
										new Filter( 'Kostv', sap.ui.model.FilterOperator.Contains, sKostv)
									]);

								} 
				*/
				this._valueHelpDialogIOrder.getBinding("items").filter([
					new Filter(this.filterFieldName, sap.ui.model.FilterOperator.Contains, sInputValue)
				]);

				// open value help dialog filtered by the input value
				this._valueHelpDialogIOrder.open(sInputValue);
			} else if (this.filterFieldName === "Posid") {
				// create value help dialog
				if (!this._valueHelpDialogWbsElement) {
					this._valueHelpDialogWbsElement = sap.ui.xmlfragment(this.dialogModule, this);
					this.getView().addDependent(this._valueHelpDialogWbsElement);
				}
				// create a filter for the binding
				this._valueHelpDialogWbsElement.getBinding("items").filter([new Filter(this.filterFieldName, sap.ui.model.FilterOperator.Contains,
					sInputValue)]);
				// open value help dialog filtered by the input value
				this._valueHelpDialogWbsElement.open(sInputValue);
			}
		},
		_handleValueHelpSearch: function (evt) {
			//var sPath = this.getView().getBindingContext().getPath();
			//var oObject = this.getModel().getObject(sPath);
			//var currentTab = this.getView().byId(sap.ui.core.Fragment.createId("frgIsrForm", "idIconTabBarFiori2")).getSelectedKey();

			var aFilterKeys = {
				"/VHDeptsSet": "Kostl",
				"/VHCostCenterSet": "Kostl",
				"/VHUserNameSet": "Bname",
				"/VHGenLedSet": "Saknr",
				"/VHIOrderSet": "Aufnr",
				"/VHWbsSet": "Posid"
			};
			var sValue = evt.getParameter("value");
			var sEntityset = evt.getParameter("itemsBinding").sPath;

			var sField = aFilterKeys[sEntityset];
			var oFilter = new Filter(sField, sap.ui.model.FilterOperator.Contains, sValue);
			evt.getSource().getBinding("items").filter([oFilter]);

			/*			if (sEntityset === "/VHCostCenterSet" && sValue === '') {
							if (currentTab === 'Racnts') {
								sValue = oObject.Zz1Rdept.substr(0, 5);
							} else {
								sValue = oObject.Zz1Sdept.substr(0, 5);
							}
						}
			*/

			/*			if (sEntityset === "/VHIOrderSet" && sValue === '') {
							var sKostv = '';
							if (currentTab === 'Racnts') {
								sKostv = oObject.Zz1Rdept.substr(0, 5);
							} else {
								sKostv = oObject.Zz1Sdept.substr(0, 5);
							}
							var oFilter = new Filter('Kostv', sap.ui.model.FilterOperator.Contains, sKostv);
							evt.getSource().getBinding("items").filter([oFilter]);
						} 
			*/

		},

		_handleValueHelpClose: function (evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				//var selectionInput = this.getView().byId(sap.ui.core.Fragment.createId("frgIsrForm",this.inputId));				
				this.oSourceField.setValue(oSelectedItem.getTitle());
				if (this.oSourceField.getName() !== "Zz1Rglacct_id" && this.oSourceField.getName() !== "Zz1Reqcc_id" && this.oSourceField.getName() !==
					"Zz1Reqio_id" && this.oSourceField.getName() !== "Zz1Reqwbs_id" && this.oSourceField.getName() !== "Zz1Sglacct_id" && this.oSourceField
					.getName() !== "Zz1Supcc_id" && this.oSourceField.getName() !== "Zz1Supio_id" && this.oSourceField.getName() !== "Zz1Supwbs_id"

				) {
					this.oSourceField.setDescription(oSelectedItem.getDescription());
				}
				this.oSourceField.fireLiveChange();
			}
			evt.getSource().getBinding("items").filter([]);
		},
		suggestionItemSelected: function (evt) {
			var sFieldName = evt.getSource().getName();
			var oItem = evt.getParameter("selectedItem"),
				oInputField =
				this.getView().byId(sap.ui.core.Fragment.createId("frgIsrForm", sFieldName)),
				sKey = oItem ? oItem.getKey() : "";
			oInputField.setValue(sKey);
		},
		/**
		 *@memberOf psu.isr.Isr.controller.CreateEntity
		 */
		addNewLineItem: function (oEvent) {

			var sPath = this.getView().getBindingContext().sPath;
			var sItemsPath = sPath + "/Items";
			var oData = this._oODataModel.getData(sPath);
			var oAppViewModel = this.getModel("appView");
			var oView = this.getView("viewModel");

			sap.ui.getCore().getMessageManager().removeAllMessages();
			oAppViewModel.setProperty("/objectPath", sPath);
			oAppViewModel.setProperty("/addingItems", true);
			oAppViewModel.setProperty("/currentTab",
				oView.byId(sap.ui.core.Fragment.createId("frgIsrForm", "idIconTabBarFiori2")).getSelectedKey());

			var oContext = this._oODataModel.createEntry(sItemsPath, {
				properties: {
					Zz1Isrno: oData.Zz1Isrno,
					Zz1IsrItmno: "new"
				}
			});
			this._oODataModel.submitChanges();
			this._oODataModel.deleteCreatedEntry(oContext);

			//this._validateSaveEnablement();

		},

		addNewRaLineItem: function (oEvent) {

			var sPath = this.getView().getBindingContext().sPath;
			var sItemsPath = sPath + "/Racnts";
			var oData = this._oODataModel.getData(sPath);
			var oAppViewModel = this.getModel("appView");
			var oView = this.getView("viewModel");

			sap.ui.getCore().getMessageManager().removeAllMessages();
			oAppViewModel.setProperty("/objectPath", sPath);
			oAppViewModel.setProperty("/currentTab",
				oView.byId(sap.ui.core.Fragment.createId("frgIsrForm", "idIconTabBarFiori2")).getSelectedKey());

			var oContext = this._oODataModel.createEntry(sItemsPath, {
				properties: {
					Zz1Isrno: oData.Zz1Isrno,
					Zz1IsrItmno: "new",
					Zz1Reqwbs: ''
				}
			});
			this._oODataModel.submitChanges();
			this._oODataModel.deleteCreatedEntry(oContext);
			
			//this._validateSaveEnablementRacnts();

		},

		addNewSaLineItem: function (oEvent) {

			var sPath = this.getView().getBindingContext().sPath;
			var sItemsPath = sPath + "/Sacnts";
			var oData = this._oODataModel.getData(sPath);
			var oAppViewModel = this.getModel("appView");
			var oView = this.getView("viewModel");

			sap.ui.getCore().getMessageManager().removeAllMessages();
			oAppViewModel.setProperty("/objectPath", sPath);
			oAppViewModel.setProperty("/currentTab",
				oView.byId(sap.ui.core.Fragment.createId("frgIsrForm", "idIconTabBarFiori2")).getSelectedKey());

			var oContext = this._oODataModel.createEntry(sItemsPath, {
				properties: {
					Zz1Isrno: oData.Zz1Isrno,
					Zz1IsrItmno: "new"
				}
			});
			this._oODataModel.submitChanges();
			this._oODataModel.deleteCreatedEntry(oContext);
			
			//this._validateSaveEnablementSacnts();

		},

		_applySearch: function (aTableSearchState) {
			var oTable = this.byId(sap.ui.core.Fragment.createId("frgIsrForm", "itemTable"));
			//oViewModel = this.getModel("viewModel");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				//oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		},

		navigateToItems: function (oEvent) {
			var oViewModel = this.getView("viewModel");
			oViewModel.byId(sap.ui.core.Fragment.createId("frgIsrForm", "idIconTabBarFiori2")).setSelectedKey("Items");
		},

		handleValidationError: function (oEvent) {
			//var oSource = oEvent.getSource();
			//var sId = oSource.getId();
			// getting dynamic Input control created using view, concat it with 'value' property of input 
			var oMessageTarget = oEvent.getSource().getId() + "/value";
			var oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
			var oMessageManager = sap.ui.getCore().getMessageManager();

			// change value state on error 
			//oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);

			// registering message processor to message manager 
			oMessageManager.registerMessageProcessor(oMessageProcessor);

			// adding new message to message model 
			oMessageManager.addMessages(new sap.ui.core.message.Message({
				message: "Please enter Reason code",
				type: sap.ui.core.MessageType.Error,
				target: oMessageTarget,
				processor: oMessageProcessor
			}));

		},

		handleValidationSuccess: function (oEvent) {

			// change value state on error 
			oEvent.getSource().setValueState(sap.ui.core.ValueState.None);

			// get message manager 
			var oMessageManager = sap.ui.getCore().getMessageManager();
			// Extract and remove the technical messages
			oMessageManager.removeAllMessages();

			var oModel = this.getOwnerComponent().getModel();
			this.setViewDataChanged(oModel.hasPendingChanges());

		},

		handleUomChange: function (oEvent) {
			var oValidateComboBox = oEvent.getSource(),
				sSelectedKey = oValidateComboBox.getSelectedKey(),
				sValue = oValidateComboBox.getValue();

			if (!sSelectedKey && sValue) {
				oValidateComboBox.setValueState("Error");
				oValidateComboBox.setValueStateText("Please enter valid Uom");
				this._oViewModel.setProperty("/enableCreate", false);
				return;

			} else {
				oValidateComboBox.setValueState("None");
				this._validateSaveEnablementItems();

			}
		},

		handleSuggest: function (oEvent) {
			var sTerm = oEvent.getParameter("SuggestValue");
			var aFilters = [];
			if (sTerm) {
				aFilters.push(new Filter("Kostl", sap.ui.model.FilterOperator.EndsWith, sTerm));

			}
			oEvent.getSource().getBinding("SuggestionItems").filter(aFilters);

		},

		onItemDeletePress: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext().getPath();
			this.getModel().remove(sPath, {
				success: this._showDeleteSuccessMessage,
				error: this._showDeleteErrorMessage
			});
			
			//this._validateSaveEnablementItems();
		},
		onRaccDeletePress: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext().getPath();
			this.getModel().remove(sPath, {
				success: this._showDeleteSuccessMessage,
				error: this._showDeleteErrorMessage
			});

			//this._validateSaveEnablementRacnts();

		},
		onSaccDeletePress: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext().getPath();
			this.getModel().remove(sPath, {
				success: this._showDeleteSuccessMessage,
				error: this._showDeleteErrorMessage
			});
			
			//this._validateSaveEnablementSacnts();

		},

		_showDeleteSuccessMessage: function (oEvent) {
			MessageToast.show("Line Item Deleted");
		},

		_showDeleteErrorMessage: function (oEvent) {
			MessageToast.show("Error while Deleting line Item");

		},

		onRaccResetPress: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext().getPath();
			this.getModel().setProperty(sPath + "/Zz1Rglacct", "");
			this.getModel().setProperty(sPath + "/Zz1Reqcc", "");
			this.getModel().setProperty(sPath + "/Zz1Reqio", "");
			this.getModel().setProperty(sPath + "/Zz1Reqwbs", "");

		},

		onSaccResetPress: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext().getPath();
			this.getModel().setProperty(sPath + "/Zz1Sglacct", "");
			this.getModel().setProperty(sPath + "/Zz1Supcc", "");
			this.getModel().setProperty(sPath + "/Zz1Supio", "");
			this.getModel().setProperty(sPath + "/Zz1Supwbs", "");

		},

		handleTabSelected: function (oEvent) {
			var sTabName = this.getModel("appView").getProperty("/currentTab");
			if (oEvent) {
				sTabName = oEvent.getParameter("key");
			}
			if (!this.getView().getElementBinding()) {
				return;
			}

			var oView = this.getView(),
				oElementBinding = this.getView().getElementBinding();

			var sPath = oElementBinding.getBoundContext().getPath(),
				oObject = oView.getModel().getObject(sPath);
			//var oViewModel = this.getModel("viewModel");

			var oAppViewModel = this.getModel("appView");
			oAppViewModel.setProperty("/currentTab", sTabName);

			oAppViewModel.setProperty("/showSaveButton", false);
			oAppViewModel.setProperty("/showCancelButton", true);

			if (sTabName === 'Header' ||
				sTabName === 'Items' ||
				sTabName === 'Racnts'
				//sTabName === 'Seracpt' 
			) {

				if (oObject && oObject.Zz1Role === "R") {
					oAppViewModel.setProperty("/showSaveButton", !(oObject.Zz1USubmit));
					oAppViewModel.setProperty("/showCancelButton", !(oObject.Zz1USubmit));
				}
			}

			if (sTabName === 'Sacnts' ||
				sTabName === 'SerComp') {

				if (oObject.Zz1USubmit === true && oObject.Zz1UScmplte === false) {
					oAppViewModel.setProperty("/showSaveButton", true);
				} else {
					oAppViewModel.setProperty("/showSaveButton", false);
				}

			}

			var oSaveBtn = oView.byId("semntcBtnSave");
			oSaveBtn.getAggregation("_control").setText("Save"); // Default Save

			if (sTabName === "SerComp" && oObject.Zz1EScmplte === true) {

				//---  Update the button text  to  'Close ISR'
				if (oObject.Zz1SaccTotal > 0) {
					oSaveBtn.getAggregation("_control").setText("Close ISR");
					this._oViewModel.setProperty("/enableCreate", true);
				}

			} else if (sTabName === "Racnts") {

				//---  Update the button text  to  "Submit for Approval"
				if (oObject.Zz1ItmsTotal === oObject.Zz1RaccTotal) {
					oSaveBtn.getAggregation("_control").setText("Submit for Approval");
				}
			}

		}

	});
});