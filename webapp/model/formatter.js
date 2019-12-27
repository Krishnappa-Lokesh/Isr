sap.ui.define([], function () {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue: function (sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		},

		acceptedValue: function (sValue) {
			if (sValue === "false") {
				return "N";
			}
			return "Y";

		},

		statusAfterSubmit: function (sMode) {
			
			var sPath = this.getView().getBindingContext().getPath();
			var bSubmit  = this.getModel().getProperty(sPath+'/Zz1USubmit');
			//if (this.getModel("appView").getProperty("/mode") === "display" ) {
			if (sMode === 'display') {
				return false;
			}else if ( bSubmit === true) {
				return false;
			}
		
			return true;
		}
		
		

	};

});