/*global location */
sap.ui.define([
	"psu/isr/Isr/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"psu/isr/Isr/model/formatter",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function (BaseController, JSONModel, formatter, MessageBox, MessageToast) {
	"use strict";

	return BaseController.extend("psu.isr.Isr.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				//mode: "display",
				delay: 0,
				//showDeleteButton: true,
				//showEditButton: false,
				showAccepted: false,
				statusText: '',
				wfStatusText: "Pendiing"


			});

			//this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			this.getRouter().getRoute("object").attachMatched(this._onObjectMatched, this);
			this.setModel(oViewModel, "detailView");
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			this._oODataModel = this.getOwnerComponent().getModel();
			this._oResourceBundle = this.getResourceBundle();

			/*			
			// Register the view with the message manager
			sap.ui.getCore().getMessageManager().registerObject(this.getView(), true);
			var oMessagesModel = sap.ui.getCore().getMessageManager().getMessageModel();
			this._oBinding = new sap.ui.model.Binding(oMessagesModel, "/", oMessagesModel.getContext("/"));
			*/

		},

		onBeforeRendering: function() {
		
			//this.handleTabSelected();			
		},

		onAfterRendering: function() {
		
			//this.handleTabSelected();			
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function () {
			var oViewModel = this.getModel("detailView");

			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function () {
			var oViewModel = this.getModel("detailView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});

			oShareDialog.open();
		},

		/**
		 * Event handler (attached declaratively) for the view delete button. Deletes the selected item. 
		 * @function
		 * @public
		 */
		onDelete: function () {
			var that = this;
			var oViewModel = this.getModel("detailView"),
				sPath = oViewModel.getProperty("/sObjectPath"),
				sObjectHeader = this._oODataModel.getProperty(sPath + "/Zz1Isrno"),
				sQuestion = this._oResourceBundle.getText("deleteText", sObjectHeader),
				sSuccessMessage = this._oResourceBundle.getText("deleteSuccess", sObjectHeader);

			var fnMyAfterDeleted = function () {
				MessageToast.show(sSuccessMessage);
				oViewModel.setProperty("/busy", false);
				var oNextItemToSelect = that.getOwnerComponent().oListSelector.findNextItem(sPath);
				that.getModel("appView").setProperty("/itemToSelect", oNextItemToSelect.getBindingContext().getPath()); //save last deleted
			};
			this._confirmDeletionByUser({
				question: sQuestion
			}, [sPath], fnMyAfterDeleted);
		},

		/**
		 * Event handler (attached declaratively) for the view edit button. Open a view to enable the user update the selected item. 
		 * @function
		 * @public
		 */
		onEdit: function () {

			var oDetView = this.getView("detailView"),
				sObjectPath = oDetView.getElementBinding().getPath(),
				sSelectedTabKey = oDetView.byId(sap.ui.core.Fragment.createId("frgIsrForm", "idIconTabBarFiori2")).getSelectedKey();

			var oAppViewModel = this.getModel("appView");
			oAppViewModel.setProperty("/addEnabled", false);
			oAppViewModel.setProperty("/mode", "edit");
			oAppViewModel.setProperty("/currentTab", sSelectedTabKey);
			oAppViewModel.setProperty("/supplierMode", false);

			//this.getView().unbindObject();

			this.getRouter().getTargets().display("create", {
				mode: "update",
				objectPath: sObjectPath
			});
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function (oEvent) {
			var _aValidTabKeys = ["Header", "Items", "Racnts", "Seracpt", "Sacnts", "SerComp"];
			var oParameter = oEvent.getParameter("arguments");

			/*
			var sObjectPath = "/" + this.getModel().createKey("IsrHeaderSet", oParameter);
			var oAppViewModel = this.getModel("appView");
			oAppViewModel.setProperty("/itemToSelect", sObjectPath);
			this.getOwnerComponent().oListSelector.selectAListItem(sObjectPath);
			*/

			// for (var value in oParameter) {
			// 	oParameter[value] = decodeURIComponent(oParameter[value]);
			// }

			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = "/" + this.getModel().createKey("IsrHeaderSet", oParameter);
				var oAppViewModel = this.getModel("appView");
				oAppViewModel.setProperty("/itemToSelect", sObjectPath);
				this.getOwnerComponent().oListSelector.selectAListItem(sObjectPath);

				var oQuery = oParameter["?tabquery"];
				//var oViewModel = this.getModel("detailView");
				//var oObject = this.getModel().getObject(sObjectPath);

				if (oQuery && _aValidTabKeys.indexOf(oQuery.tab) > -1) {

					/*
					//---  Enable add only for Requestor Role
					if (oObject && oObject.Zz1Role === "R") {
						this.getModel("appView").setProperty("/addEnabled", true);
						this.getModel("appView").setProperty("/isRequestor", true);
					}

				
					var sTabBar = "Header";
					if ((oObject.Zz1EScmplte) === true) {
						sTabBar = "SerComp";

					} else if ((oObject.Zz1ESacc) === true) {
						sTabBar = "Sacnts";

					} else if ((oObject.Zz1ESacpt) === true) {
						sTabBar = "Seracpt";

					} else if ((oObject.Zz1ERacc) === true) {
						sTabBar = "Racnts";

					} else if ((oObject.Zz1EItems) === true) {
						sTabBar = "Items";

					}
					oQuery.tab = sTabBar;
				
					*/

					oAppViewModel.setProperty("/currentTab", oQuery.tab);

					/*
					if (oQuery.tab === 'Header' ||
						oQuery.tab === 'Items' ||
						oQuery.tab === 'Racnts' ||
						oQuery.tab === 'Seracpt') {
						if (oObject) {
							oViewModel.setProperty("/showEditButton", !(oObject.Zz1USubmit));
							oViewModel.setProperty("/showDeleteButton", !(oObject.Zz1USubmit));
						}
					}

					if (oQuery.tab === 'Sacnts' ||
						oQuery.tab === 'SerComp') {

						oViewModel.setProperty("/showDeleteButton", false);
						if (oObject.Zz1USubmit === true && oObject.Zz1UScmplte === false) {
							oViewModel.setProperty("/showEditButton", true);
						} else {
							oViewModel.setProperty("/showEditButton", false);
						}
					}
					*/

				} else {

					// the default query param should be visible at all time
					this.getRouter().navTo("object", {
						Zz1Isrno: oParameter,
						tabquery: {
							tab: _aValidTabKeys[0]
						}
					}, true /*no history*/ );
				}

				this._bindView(sObjectPath);
			}.bind(this));

		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function (sObjectPath) {

			// Set busy indicator during view binding
			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		/**
		 * Event handler for binding change event
		 * @function
		 * @private
		 */

		_onBindingChange: function () {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding(),
				oViewModel = this.getModel("detailView");

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var
				sPath = oElementBinding.getBoundContext().getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.Zz1Isrno,
				sObjectName = oObject.Zz1Isrno;

			oViewModel.setProperty("/sObjectId", sObjectId);
			oViewModel.setProperty("/sObjectPath", sPath);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));

			/*			
						var oTabBar = oView.byId(sap.ui.core.Fragment.createId("frgIsrForm", "idIconTabBarFiori2"));
						// Navigate to respective tab
						oTabBar.setSelectedKey("Header");
						oViewModel.setProperty("/showEditButton", true);
						oViewModel.setProperty("/showDeleteButton", true);

						if ((oObject.Zz1EScmplte) === true) {
							oTabBar.setSelectedKey("SerComp");

							oViewModel.setProperty("/showDeleteButton", false);
							if (oObject.Zz1USubmit === true && oObject.Zz1UScmplte === false) {
								oViewModel.setProperty("/showEditButton", true);
							} else {
								oViewModel.setProperty("/showEditButton", false);
							}

						} else if ((oObject.Zz1ESacc) === true) {
							oTabBar.setSelectedKey("Sacnts");

							oViewModel.setProperty("/showDeleteButton", false);
							if (oObject.Zz1USubmit === true && oObject.Zz1UScmplte === false) {
								oViewModel.setProperty("/showEditButton", true);
							} else {
								oViewModel.setProperty("/showEditButton", false);
							}

						} else if ((oObject.Zz1ESacpt) === true) {
							oTabBar.setSelectedKey("Seracpt");
							oViewModel.setProperty("/showEditButton", !(oObject.Zz1USubmit));
							oViewModel.setProperty("/showDeleteButton", !(oObject.Zz1USubmit));

						} else if ((oObject.Zz1ERacc) === true) {
							oTabBar.setSelectedKey("Racnts");
							oViewModel.setProperty("/showEditButton", !(oObject.Zz1USubmit));
							oViewModel.setProperty("/showDeleteButton", !(oObject.Zz1USubmit));

						} else if ((oObject.Zz1EItems) === true) {
							oTabBar.setSelectedKey("Items");
							oViewModel.setProperty("/showEditButton", !(oObject.Zz1USubmit));
							oViewModel.setProperty("/showDeleteButton", !(oObject.Zz1USubmit));

						}
			*/

			var oAppViewModel = this.getModel("appView");

			//---  Enable add only for Requestor Role
			if (oObject && oObject.Zz1Role === "R") {
				this.getModel("appView").setProperty("/addEnabled", true);
				this.getModel("appView").setProperty("/isRequestor", true);
			}

			var sTabBar = oAppViewModel.getProperty("/currentTab");

			// Set Edit/Delete button to disabled by default
			//oViewModel.setProperty("/showEditButton", false);
			//oViewModel.setProperty("/showDeleteButton", false);

			oAppViewModel.setProperty("/showEditButton", false);
			oAppViewModel.setProperty("/showDeleteButton", false);

			if (sTabBar === 'Header' ||
				sTabBar === 'Items' ||
				sTabBar === 'Racnts' ||
				sTabBar === 'Seracpt') {
				if (oObject && oObject.Zz1Role === "R") {
					//oViewModel.setProperty("/showEditButton", !(oObject.Zz1USubmit));
					//oViewModel.setProperty("/showDeleteButton", !(oObject.Zz1USubmit));

					oAppViewModel.setProperty("/showEditButton", !(oObject.Zz1USubmit));
					oAppViewModel.setProperty("/showDeleteButton", !(oObject.Zz1USubmit));

				}
			}

			if (sTabBar === 'Sacnts' ||
				sTabBar === 'SerComp') {

				//oViewModel.setProperty("/showDeleteButton", false);
				if (oObject && oObject.Zz1Role === "S") {
					if (oObject.Zz1USubmit === true && oObject.Zz1UScmplte === false) {
						//oViewModel.setProperty("/showEditButton", true);
						oAppViewModel.setProperty("/showEditButton", true);
					} else {
						//oViewModel.setProperty("/showEditButton", false);
						oAppViewModel.setProperty("/showEditButton", false);
					}
				}

			}

			//--- Status Text
			oViewModel.setProperty("/showAccepted", (oObject.Zz1Saccept || oObject.Zz1Scomplete));
			if (oObject.Zz1Saccept) {
				oViewModel.setProperty("/wfStatusText", 'Approved');
				oViewModel.setProperty("/statusText", 'Accepted');
			} else {
				if (oObject.Zz1USubmit) {
					oViewModel.setProperty("/wfStatusText", 'Process');

				}
			}
			if (oObject.Zz1Scomplete) {
				oViewModel.setProperty("/statusText", 'Closed');
			}

		},

		/**
		 * Event handler for metadata loaded event
		 * @function
		 * @private
		 */

		_onMetadataLoaded: function () {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView");

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		/**
		 * Opens a dialog letting the user either confirm or cancel the deletion of a list of entities
		 * @param {object} oConfirmation - Possesses up to two attributes: question (obligatory) is a string providing the statement presented to the user.
		 * title (optional) may be a string defining the title of the popup.
		 * @param {object} oConfirmation - Possesses up to two attributes: question (obligatory) is a string providing the statement presented to the user.
		 * @param {array} aPaths -  Array of strings representing the context paths to the entities to be deleted. Currently only one is supported.
		 * @param {callback} fnAfterDeleted (optional) - called after deletion is done. 
		 * @param {callback} fnDeleteCanceled (optional) - called when the user decides not to perform the deletion
		 * @param {callback} fnDeleteConfirmed (optional) - called when the user decides to perform the deletion. A Promise will be passed
		 * @function
		 * @private
		 */
		/* eslint-disable */ // using more then 4 parameters for a function is justified here
		_confirmDeletionByUser: function (oConfirmation, aPaths, fnAfterDeleted, fnDeleteCanceled, fnDeleteConfirmed) {
			/* eslint-enable */
			// Callback function for when the user decides to perform the deletion
			var fnDelete = function () {
				// Calls the oData Delete service
				this._callDelete(aPaths, fnAfterDeleted);
			}.bind(this);

			// Opens the confirmation dialog
			MessageBox.show(oConfirmation.question, {
				icon: oConfirmation.icon || MessageBox.Icon.WARNING,
				title: oConfirmation.title || this._oResourceBundle.getText("delete"),
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				onClose: function (oAction) {
					if (oAction === MessageBox.Action.OK) {
						fnDelete();
					} else if (fnDeleteCanceled) {
						fnDeleteCanceled();
					}
				}
			});
		},

		/**
		 * Performs the deletion of a list of entities.
		 * @param {array} aPaths -  Array of strings representing the context paths to the entities to be deleted. Currently only one is supported.
		 * @param {callback} fnAfterDeleted (optional) - called after deletion is done. 
		 * @return a Promise that will be resolved as soon as the deletion process ended successfully.
		 * @function
		 * @private
		 */
		_callDelete: function (aPaths, fnAfterDeleted) {
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/busy", true);
			var fnFailed = function () {
				this._oODataModel.setUseBatch(true);
			}.bind(this);
			var fnSuccess = function () {
				if (fnAfterDeleted) {
					fnAfterDeleted();
					this._oODataModel.setUseBatch(true);
				}
				oViewModel.setProperty("/busy", false);
			}.bind(this);
			return this._deleteOneEntity(aPaths[0], fnSuccess, fnFailed);
		},

		/**
		 * Deletes the entity from the odata model
		 * @param {array} aPaths -  Array of strings representing the context paths to the entities to be deleted. Currently only one is supported.
		 * @param {callback} fnSuccess - Event handler for success operation.
		 * @param {callback} fnFailed - Event handler for failure operation.
		 * @function
		 * @private
		 */
		_deleteOneEntity: function (sPath, fnSuccess, fnFailed) {
			var oPromise = new Promise(function (fnResolve, fnReject) {
				this._oODataModel.setUseBatch(false);
				this._oODataModel.remove(sPath, {
					success: fnResolve,
					error: fnReject,
					async: true
				});
			}.bind(this));
			oPromise.then(fnSuccess, fnFailed);
			return oPromise;
		},

		handleTabSelected: function (oEvent) {
			var sTabName = 	this.getModel("appView").getProperty("/currentTab");
			if (oEvent) {
			 sTabName = oEvent.getParameter("key");
			} 
			if (!this.getView().getElementBinding()) {
				return;
			}
			
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding(),
				sPath = oElementBinding.getBoundContext().getPath(),
				oObject = oView.getModel().getObject(sPath);
			var oViewModel = this.getModel("detailView");

			var oAppViewModel = this.getModel("appView");
			oAppViewModel.setProperty("/currentTab", sTabName);

			// Disable the delete button by default
			oViewModel.setProperty("/showDeleteButton", false);
			oAppViewModel.setProperty("/showDeleteButton", false);


			if (
				sTabName === 'Header' ||
				sTabName === 'Items' ||
				sTabName === 'Racnts' ||
				sTabName === 'Seracpt') {
				if (oObject && oObject.Zz1Role === "R") {
					//oViewModel.setProperty("/showEditButton", !(oObject.Zz1USubmit));
					//oViewModel.setProperty("/showDeleteButton", !(oObject.Zz1USubmit));

					oAppViewModel.setProperty("/showEditButton", !(oObject.Zz1USubmit));
					oAppViewModel.setProperty("/showDeleteButton", !(oObject.Zz1USubmit));


				}
			}

			if (sTabName === 'Sacnts' ||
				sTabName === 'SerComp') {

				//oViewModel.setProperty("/showDeleteButton", false);
				if (oObject && oObject.Zz1Role === "S") {
				
				if (oObject.Zz1USubmit === true && oObject.Zz1UScmplte === false) {
					//oViewModel.setProperty("/showEditButton", true);
					oAppViewModel.setProperty("/showEditButton", true);
				} else {
					//oViewModel.setProperty("/showEditButton", false);
					oAppViewModel.setProperty("/showEditButton", false);
				}
				}
			}

			this.getRouter().navTo("object", {
				Zz1Isrno: oObject.Zz1Isrno,
				tabquery: {
					tab: sTabName
				}
			}, true /*without history*/ );

			/*		if ( sTabName === 'Racnts'  )	{
						var oBtnSubmit = this.getView().byId("semntcBtnSubmit");	
							
						}
			*/
		}

	});
});