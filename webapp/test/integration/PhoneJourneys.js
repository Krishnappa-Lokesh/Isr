jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/test/Opa5",
	"psu/isr/Isr/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"psu/isr/Isr/test/integration/pages/App",
	"psu/isr/Isr/test/integration/pages/Browser",
	"psu/isr/Isr/test/integration/pages/Master",
	"psu/isr/Isr/test/integration/pages/Detail",
	"psu/isr/Isr/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "psu.isr.Isr.view."
	});

	sap.ui.require([
		"psu/isr/Isr/test/integration/NavigationJourneyPhone",
		"psu/isr/Isr/test/integration/NotFoundJourneyPhone",
		"psu/isr/Isr/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});