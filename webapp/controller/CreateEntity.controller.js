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

			//if (oModel.getProperty(sPath + "/Zz1EScmplte") === true && oModel.getProperty(sPath + "/Zz1Scomplete") === false) {
			if (sCurrentTab === "SerComp") {
				if (oModel.getProperty(sPath + "/Zz1NotesC") === "" && oModel.getProperty(sPath + "/Zz1Scomplete") === false) {

					var oMessage = new Message({
						code: "ZFICO",
						message: "Please enter Notes ",
						type: MessageType.Error,
						target: "/Dummy",
						processer: this.getView().getModel()

					});
					sap.ui.getCore().getMessageManager().addMessages(oMessage);

					return;
				}

				MessageBox.confirm(this._oResourceBundle.getText("supplierClsConfirmMesage"), {
					styleClass: this.getOwnerComponent().getContentDensityClass(),
					onClose: function (oAction) {
						if (oAction === sap.m.MessageBox.Action.OK) {

							var sPathMb = that.getView().getBindingContext().getPath();
							that.getModel().setProperty(sPathMb + "/Zz1UScmplte", true);

							that.getModel('viewModel').setProperty('bHasErrors', false);
							that._handleSave();
						} else {
							that.getModel("appView").setProperty("/addEnabled", true);
							that.getModel('viewModel').setProperty('bHasErrors', true);
							that._oODataModel.resetChanges();
							that._navBack();
						}
					}
				});

				//} else if (oModel.getProperty(sPath + "/Zz1ERacc") === true && oModel.getProperty(sPath + "/Zz1USubmit") === false) {
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
							if (oAction === sap.m.MessageBox.Action.OK) {
								that.getModel('viewModel').setProperty('bHasErrors', false);
								that._handleSave();
							} else {
								that.getModel("appView").setProperty("/addEnabled", true);
								that.getModel('viewModel').setProperty('bHasErrors', true);
								that._oODataModel.resetChanges();
								that._navBack();
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

			//if ( oModel.getProperty(sPath + "/Zz1ESacc") === true &&
			//	nItmsTotal === nRaccTotal) {
			if (nItmsTotal === nRaccTotal) {

				MessageBox.confirm(this._oResourceBundle.getText("submitConfirmationMesage"), {
					styleClass: this.getOwnerComponent().getContentDensityClass(),
					onClose: function (oAction) {
						if (oAction === sap.m.MessageBox.Action.OK) {

							var sPathMb = that.getView().getBindingContext().getPath();
							that.getModel().setProperty(sPathMb + "/Zz1USubmit", true);

							that.getModel("appView").setProperty("/addEnabled", true);
							that.getModel('viewModel').setProperty('bHasErrors', false);
							that._handleSave();

						}
					}
				});

			}

		},

		_handleSave: function (oEvent) {

			var that = this,
				oModel = this.getModel();
			var oView = this.getView();
			var sPath = oView.getBindingContext().sPath;

			if (this.getModel('viewModel').getProperty('bHasErrors') === true) {
				return;
			}

			if (oModel.getProperty(sPath + "/Zz1EScmplte") === true && oModel.getProperty(sPath + "/Zz1Scomplete") === true) {
				var sPathMb = this.getView().getBindingContext().getPath();
				this.getModel().setProperty(sPathMb + "/Zz1UScmplte", true);
			}

			this.getModel("appView").setProperty("/saveBtnPressed", true);
			this.getModel("appView").setProperty("/isrDraft", false);
			this.getModel("appView").setProperty("/busy", true);

			//if (this._oViewModel.getProperty("/mode") === "edit") {
			if (this.getModel("appView").getProperty("/mode") === "edit") {

				// attach to the request completed event of the batch
				oModel.attachEventOnce("batchRequestCompleted", function (oEvent) {
					if (that._checkIfBatchRequestSucceeded(oEvent)) {
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
						MessageToast.show("Data Saved", {
							duration: 3000, // default
							width: "15em", // default
							my: sap.ui.core.Popup.Dock.CenterCenter,
							at: sap.ui.core.Popup.Dock.CenterCenter,
							of: window, // default
							offset: "0 0", // default
							collision: "fit fit", // default
							onClose: null, // default
							autoClose: false, // default
							animationTimingFunction: "ease", // default
							animationDuration: 1000, // default
							closeOnBrowserNavigation: true // default
						});

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
		/**
		 * Event handler (attached declaratively) for the view MessagePopover button. 
		 * @function
		 * @public
		 */
		/*		onMessagePopoverPress: function (oEvent) {
					var oMessagesButton = oEvent.getSource();
					if (!this._messagePopover) {
						this._messagePopover = new MessagePopover({
							items: {
								path: "message>/",
								template: new MessagePopoverItem({
									description: "{message>description}",
									type: "{message>type}",
									title: "{message>message}"
								})
							}
						});
						oMessagesButton.addDependent(this._messagePopover);
					}
					this._messagePopover.toggle(oMessagesButton);
				},*/

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
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to the Details page
		 * @private
		 */
		_navBack: function () {
			var oHistory = sap.ui.core.routing.History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash();

			this.getView().unbindObject();
			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				this.getRouter().getTargets().display("object");

				// var sPath = this.getView().getBindingContext().getPath();
				// var sIsrNo = this.getModel().getProperty(sPath + '/Zz1Isrno');
				// this.getRouter().navTo("object", {
				//  	Zz1Isrno: sIsrNo
				//  }, true);

			}
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
						that.getModel("appView").setProperty("/addEnabled", true);
						that.getModel("appView").setProperty("/isrDraft", false);
						that.getModel("appView").setProperty("/mode", "display");
						oModel.resetChanges();
						that._navBack();
					}
				}
			});
		},
		/**
		 * Prepares the view for editing the selected object
		 * @param {sap.ui.base.Event} oEvent the  display event
		 * @private
		 */
		_onEdit: function (oEvent) {
			var oData = oEvent.getParameter("data"),
				oView = this.getView(),
				oObject = oView.getModel().getObject(oData.objectPath);


			this._oViewModel.setProperty("/enableCreate", false);
			this._oViewModel.setProperty("/viewTitle", this._oResourceBundle.getText("editViewTitle"));
			oView.bindElement({
				path: oData.objectPath
			});

			var oAppViewModel = this.getModel("appView");
			oView.byId(sap.ui.core.Fragment.createId("frgIsrForm", "idIconTabBarFiori2")).setSelectedKey(oAppViewModel.getProperty(
				"/currentTab"));

			oAppViewModel.setProperty("/mode", "edit");
			if (oObject.Zz1ESacc) {
			oAppViewModel.setProperty("/supplierMode", true);
			}

			var oSaveBtn = oView.byId("semntcBtnSave");
			oSaveBtn.getAggregation("_control").setText("Save"); // Default Save

			// Navigate to respective tab
			// oView.byId(sap.ui.core.Fragment.createId("frgIsrForm", "idIconTabBarFiori2")).setSelectedKey(
			// 	"Header");

			var sSelectedKey = oView.byId(sap.ui.core.Fragment.createId("frgIsrForm", "idIconTabBarFiori2")).getSelectedKey();

			if (sSelectedKey === "SerComp" && oObject.Zz1EScmplte === true) {

				//---  Update the button text  to  'Close ISR'
				if (oObject.Zz1SaccTotal > 0) {
					oSaveBtn.getAggregation("_control").setText("Close ISR");
					this._oViewModel.setProperty("/enableCreate", true);
				}

			} else if (sSelectedKey === "Sacnts" && oObject.Zz1ESacc === true) {
				oView.byId(sap.ui.core.Fragment.createId("frgIsrForm", "idIconTabBarFiori2")).setSelectedKey(
					"Sacnts");

			} else if (sSelectedKey === "Seracpt" && oObject.Zz1ESacpt === true) {


			} else if (sSelectedKey === "Racnts" && oObject.Zz1ESacpt === true) {
				
				//---  Update the button text  to  "Submit for Approval"
				if (oObject.Zz1ItmsTotal === oObject.Zz1RaccTotal) {
					oSaveBtn.getAggregation("_control").setText("Submit for Approval");
				}

				//_validateSaveEnablementRacnts

			} else if (sSelectedKey === "Items" && oObject.Zz1ESacpt === true) {

			}

		},
		/**
		 * Prepares the view for creating new object
		 * @param {sap.ui.base.Event} oEvent the  display event
		 * @private
		 */
		_onCreate: function (oEvent) {
			if (oEvent.getParameter("name") && oEvent.getParameter("name") !== "create") {
				this._oViewModel.setProperty("/enableCreate", false);
				this.getRouter().getTargets().detachDisplay(null, this._onDisplay, this);
				this.getView().unbindObject();
				return;
			}
			this._oViewModel.setProperty("/viewTitle", this._oResourceBundle.getText("createViewTitle"));

			//this._oViewModel.setProperty("/mode", "create");
			this.getModel("appView").setProperty("/mode", "edit");

			var oView = this.getView();
			var oSaveBtn = oView.byId("semntcBtnSave");
			oSaveBtn.getAggregation("_control").setText("Save"); // Default Save

			// Navigate to respective tab
			oView.byId(sap.ui.core.Fragment.createId("frgIsrForm", "idIconTabBarFiori2")).setSelectedKey(
				"Header");

			var oContext = this._oODataModel.createEntry("IsrHeaderSet", {
				properties: {
					Zz1Isrno: "new",
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
			//aItems.forEach(this._processEachItem );
			var oModel = this.getModel();
			var oViewModel = this.getModel("viewModel");
			oViewModel.grandTotal = 0;

			for (var tableLineItem in aItems) {
				var sPath = aItems[tableLineItem].getBindingContext().sPath;
				var oLineItem = oModel.getProperty(aItems[tableLineItem].getBindingContext().sPath);
				var nLineItemTotal = oLineItem.Zz1Quantity * oLineItem.Zz1Unitprice;
				oViewModel.grandTotal += oLineItem.Zz1Quantity * oLineItem.Zz1Unitprice;

				oLineItem.Zz1Total = nLineItemTotal.toString();
				oModel.setProperty(sPath + "/Zz1Total", oLineItem.Zz1Total);

				// When Line item total is zero disable save button
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
			//Update Items Total
			// var oToolbar = this.getView().byId(sap.ui.core.Fragment.createId("frgIsrForm", "itemTable")).getHeaderToolbar();
			// var aTbControls = oToolbar.getContent();
			// for (var iTbCtrlIndex in aTbControls) {
			// 	//if ( aTbControls[iTbCtrlIndex].getId() === "itemTbTitle") {  }
			// 	aTbControls[0].setProperty("text", "ISR Items  Total: " + oViewModel.grandTotal);

			// }

			// update header total
			var sHeaderPath = this.getView().getBindingContext().sPath;
			oModel.setProperty(sHeaderPath + "/Zz1ItmsTotal", oViewModel.grandTotal.toString());

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
			//aItems.forEach(this._processEachItem );
			var oModel = this.getModel();
			var oViewModel = this.getModel("viewModel");

			// Calculate total
			oViewModel.racntTotal = 0;
			for (var tableLineItem in aItems) {
				var sPath = aItems[tableLineItem].getBindingContext().sPath;
				var oLineItem = oModel.getProperty(aItems[tableLineItem].getBindingContext().sPath);
				var nLineItemTotal = oLineItem.Zz1Ramtcobj * 1;
				oViewModel.racntTotal += nLineItemTotal;

			}
			// ---- Update Requestor accounts Total
			var oToolbar = this.getView().byId(sap.ui.core.Fragment.createId("frgIsrForm", "racntsTable")).getHeaderToolbar();
			var aTbControls = oToolbar.getContent();
			//for (var iTbCtrlIndex in aTbControls) {
			//if ( aTbControls[iTbCtrlIndex].getId() === "itemTbTitle") {  }
			aTbControls[0].setProperty("text", " Total: " + oViewModel.racntTotal);

			//}

			//--------- update header total
			var sHeaderPath = this.getView().getBindingContext().sPath;
			oModel.setProperty(sHeaderPath + "/Zz1RaccTotal", oViewModel.racntTotal.toString());

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

		_validateSaveEnablementSacnts: function () {

			var aItems = this.getView().byId(sap.ui.core.Fragment.createId("frgIsrForm", "sacntsTable")).getItems();
			//aItems.forEach(this._processEachItem );
			var oModel = this.getModel();
			var oViewModel = this.getModel("viewModel");
			oViewModel.sacntTotal = 0;

			for (var tableLineItem in aItems) {
				var sPath = aItems[tableLineItem].getBindingContext().sPath;
				var oLineItem = oModel.getProperty(aItems[tableLineItem].getBindingContext().sPath);
				var nLineItemTotal = oLineItem.Zz1Samtcobj * 1;
				oViewModel.sacntTotal += nLineItemTotal;

				//oLineItem.Zz1Total = nLineItemTotal.toString();
				//oModel.setProperty(sPath + "/Zz1Total", oLineItem.Zz1Total);
				/*				if (!oViewModel.sacntTotal) {
									this._oViewModel.setProperty("/enableCreate", false);
									return;
								}
				*/
			}
			// Update Items Total
			var oToolbar = this.getView().byId(sap.ui.core.Fragment.createId("frgIsrForm", "sacntsTable")).getHeaderToolbar();
			var aTbControls = oToolbar.getContent();
			aTbControls[0].setProperty("text", " Total: " + oViewModel.sacntTotal);

			// update header total
			var sHeaderPath = this.getView().getBindingContext().sPath;
			oModel.setProperty(sHeaderPath + "/Zz1SaccTotal", oViewModel.sacntTotal.toString());

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

					if (!aMessages[i].code.includes("ZFICO")) {

						if (aMessages[i].type === "Error" && !aMessages[i].technical) {
							bEnableCreate = false;
							break;
						}
					}
				}
				this._oViewModel.setProperty("/enableCreate", bEnableCreate);
			} else {
				this._oViewModel.setProperty("/enableCreate", true);
			}
		},
		/**
		 * Handles the success of updating an object
		 * @private
		 */
		_fnUpdateSuccess: function () {
			this.getModel("appView").setProperty("/busy", false);
			var sObjectPath = this.getView().getElementBinding().getPath();
			this.getModel("appView").setProperty("/itemToSelect", sObjectPath);
			this.getModel("appView").setProperty("/mode", "display");

			this.getView().unbindObject();
			this._navBack();

			//if (this.getModel("appView").getProperty("/saveBtnPressed") === true) {
			//	this.getRouter().getTargets().display("object");
			//}
			//var sIsrNo = this.getView().getBindingContext().getProperty("Zz1Isrno");
			//this.getView().unbindObject();
			//this.getRouter().navTo("object", {
			//	Zz1Isrno: encodeURIComponent(sIsrNo)
			//}, true);

		},
		/**
		 * Handles the success of creating an object
		 *@param {object} oData the response of the save action
		 * @private
		 */
		_fnEntityCreated: function (oData) {
			var sObjectPath = this.getModel().createKey("IsrHeaderSet", oData);
			this.getModel("appView").setProperty("/itemToSelect", "/" + sObjectPath);

			//save last created
			this.getModel("appView").setProperty("/busy", false);
			this.getModel("appView").setProperty("/mode", "display");

			//if (this.getModel("appView").getProperty("/saveBtnPressed") === true) {
			this.getRouter().getTargets().display("object");
			//}
		},
		/**
		 * Handles the failure of creating/updating an object
		 * @private
		 */
		_fnEntityCreationFailed: function () {
			this.getModel("appView").setProperty("/busy", false);
		},
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
				this._onCreate(oEvent);
			}
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
		handleValueHelp: function (oEvent) {
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

			// if (this.inputId === "Zz1Rdept_id" || this.inputId === "Zz1Sdept_id") {
			// 	this.filterFieldName = aFieldName["Dept"];
			// } else {
				this.filterFieldName = aFieldName[this.inputId];
			//}

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
				this._valueHelpDialogDepartment.getBinding("items").filter([new Filter("Kostl", sap.ui.model.FilterOperator.Contains,
					sInputValue)]);
				// open value help dialog filtered by the input value
				this._valueHelpDialogDepartment.open(sInputValue);
			} else if (this.filterFieldName === "Kostl") {
				// create value help dialog
				if (!this._valueHelpDialogCostCenter) {
					this._valueHelpDialogCostCenter = sap.ui.xmlfragment(this.dialogModule, this);
					this.getView().addDependent(this._valueHelpDialogCostCenter);
				}
				// create a filter for the binding
				this._valueHelpDialogCostCenter.getBinding("items").filter([new Filter(this.filterFieldName, sap.ui.model.FilterOperator.Contains,
					sInputValue)]);
				// open value help dialog filtered by the input value
				this._valueHelpDialogCostCenter.open(sInputValue);
			} else if (this.filterFieldName === "Saknr") {
				// create value help dialog
				if (!this._valueHelpDialogGlAccount) {
					this._valueHelpDialogGlAccount = sap.ui.xmlfragment(this.dialogModule, this);
					this.getView().addDependent(this._valueHelpDialogGlAccount);
				}
				// create a filter for the binding
				this._valueHelpDialogGlAccount.getBinding("items").filter([new Filter(this.filterFieldName, sap.ui.model.FilterOperator.Contains,
					sInputValue)]);
				// open value help dialog filtered by the input value
				this._valueHelpDialogGlAccount.open(sInputValue);
			} else if (this.filterFieldName === "Aufnr") {
				// create value help dialog
				if (!this._valueHelpDialogIOrder) {
					this._valueHelpDialogIOrder = sap.ui.xmlfragment(this.dialogModule, this);
					this.getView().addDependent(this._valueHelpDialogIOrder);
				}
				// create a filter for the binding
				this._valueHelpDialogIOrder.getBinding("items").filter([new Filter(this.filterFieldName, sap.ui.model.FilterOperator.Contains,
					sInputValue)]);
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
			oAppViewModel.setProperty("/isrDraft", true);
			oAppViewModel.setProperty("/currentTab",
				oView.byId(sap.ui.core.Fragment.createId("frgIsrForm", "idIconTabBarFiori2")).getSelectedKey());

			this._oODataModel.createEntry(sItemsPath, {
				properties: {
					Zz1Isrno: oData.Zz1Isrno,
					Zz1IsrItmno: "new"
				}
			});
			this._oODataModel.submitChanges();

		},

		addNewRaLineItem: function (oEvent) {

			var sPath = this.getView().getBindingContext().sPath;
			var sItemsPath = sPath + "/Racnts";
			var oData = this._oODataModel.getData(sPath);
			var oAppViewModel = this.getModel("appView");
			var oView = this.getView("viewModel");

			sap.ui.getCore().getMessageManager().removeAllMessages();
			oAppViewModel.setProperty("/objectPath", sPath);
			oAppViewModel.setProperty("/isrDraft", true);
			oAppViewModel.setProperty("/currentTab",
				oView.byId(sap.ui.core.Fragment.createId("frgIsrForm", "idIconTabBarFiori2")).getSelectedKey());

			this._oODataModel.createEntry(sItemsPath, {
				properties: {
					Zz1Isrno: oData.Zz1Isrno,
					Zz1IsrItmno: "new",
					Zz1Reqwbs: ''
				}
			});
			this._oODataModel.submitChanges();

		},

		addNewSaLineItem: function (oEvent) {

			var sPath = this.getView().getBindingContext().sPath;
			var sItemsPath = sPath + "/Sacnts";
			var oData = this._oODataModel.getData(sPath);
			var oAppViewModel = this.getModel("appView");
			var oView = this.getView("viewModel");

			sap.ui.getCore().getMessageManager().removeAllMessages();
			oAppViewModel.setProperty("/objectPath", sPath);
			oAppViewModel.setProperty("/isrDraft", true);
			oAppViewModel.setProperty("/currentTab",
				oView.byId(sap.ui.core.Fragment.createId("frgIsrForm", "idIconTabBarFiori2")).getSelectedKey());

			this._oODataModel.createEntry(sItemsPath, {
				properties: {
					Zz1Isrno: oData.Zz1Isrno,
					Zz1IsrItmno: "new"
				}
			});
			this._oODataModel.submitChanges();

		},

		_applySearch: function (aTableSearchState) {
			var oTable = this.byId(sap.ui.core.Fragment.createId("frgIsrForm", "itemTable")),
				oViewModel = this.getModel("viewModel");
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
		
		onItemDeletePress: function(oEvent) {
			var sPath  = oEvent.getSource().getBindingContext().getPath();
			this.getModel().remove(sPath, 
				{ success: this._showDeleteSuccessMessage, 
				  error: this._showDeleteErrorMessage });

		},
		
		_showDeleteSuccessMessage: function(oEvent) {
			MessageToast.show("Line Item Deleted");
		},
		
		_showDeleteErrorMessage: function(oEvent) {
			MessageToast.show("Error while Deleting line Item");
			
		},
		
		
		handleTabSelected: function (oEvent) {
			var sTabName = oEvent.getParameter("key");
			var oView = this.getView(),
				oElementBinding = this.getView().getElementBinding(),
				sPath = oElementBinding.getBoundContext().getPath(),
				oObject = oView.getModel().getObject(sPath);
			var oViewModel = this.getModel("viewModel");

			if (sTabName === 'Header' ||
				sTabName === 'Items' ||
				sTabName === 'Racnts' ||
				sTabName === 'Seracpt') {

				oViewModel.setProperty("/showEditButton", !(oObject.Zz1USubmit));
				oViewModel.setProperty("/showDeleteButton", !(oObject.Zz1USubmit));
				
				
			}

			if (sTabName === 'Sacnts' ||
				sTabName === 'SerComp') {

				oViewModel.setProperty("/showDeleteButton", false);
				if (oObject.Zz1USubmit === true && oObject.Zz1UScmplte === false)  {
					oViewModel.setProperty("/showEditButton", true);
				} else {
					oViewModel.setProperty("/showEditButton", false);
				}
			}

		}
		
	});
});