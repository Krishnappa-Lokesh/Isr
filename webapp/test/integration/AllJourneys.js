jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 IsrHeaderSet in the list

sap.ui.require([
	"sap/ui/test/Opa5",
	"psu/isr/Isr/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"psu/isr/Isr/test/integration/pages/App",
	"psu/isr/Isr/test/integration/pages/Browser",
	"psu/isr/Isr/test/integration/pages/Master",
	"psu/isr/Isr/test/integration/pages/Detail",
	"psu/isr/Isr/test/integration/pages/Create",
	"psu/isr/Isr/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "psu.isr.Isr.view."
	});

	sap.ui.require([
		"psu/isr/Isr/test/integration/MasterJourney",
		"psu/isr/Isr/test/integration/NavigationJourney",
		"psu/isr/Isr/test/integration/NotFoundJourney",
		"psu/isr/Isr/test/integration/BusyJourney",
		"psu/isr/Isr/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});