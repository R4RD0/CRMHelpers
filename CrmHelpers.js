/*!  
    * ==============================
    * CRM HELPER LIBRARY
    * ==============================
    * Dynamic visibility and deletion logic for Dynamics 365 forms.
    * One script, drop on any form, wire up to OnChange handlers.
    * Usage examples are above each function.
    * ==============================
    * Copyright (c) 2025 Luke Cutmore
    * Licensed under the MIT License.
    * https://github.com/R4RD0/CrmHelpers
    * https://lukecutmore.com
 */

var CrmHelpers = {
  previousValues: {},

  // ==============================
  // _matches (private)
  // ==============================
  // Shared match logic. Accepts the option set value as a number,
  // a numeric string, or the label itself. Returns true on match.
  _matches: function (attribute, matchValue) {
    if (!attribute) return false;

    var value = attribute.getValue();
    var label = attribute.getText();

    if (typeof matchValue === "number") {
      return value === matchValue;
    }

    if (typeof matchValue === "string") {
      var num = parseInt(matchValue, 10);
      if (!isNaN(num) && value === num) return true;
      if (label && label.toLowerCase() === matchValue.toLowerCase()) return true;
    }

    return false;
  },

  // ==============================
  // toggleControl
  // ==============================
  // Shows/hides any control based on a match.
  // Example usage:
  // CrmHelpers.toggleControl(executionContext, "account_type", 100000001, "new_description");
  // CrmHelpers.toggleControl(executionContext, "account_type", "Partner", "new_description");
  toggleControl: function (executionContext, triggerField, matchValue, targetControlName) {
    var formContext = executionContext.getFormContext();
    var attribute = formContext.getAttribute(triggerField);
    if (!attribute) return;

    var control = formContext.ui.controls.get(targetControlName);
    if (control) control.setVisible(CrmHelpers._matches(attribute, matchValue));
  },

  // ==============================
  // toggleTab
  // ==============================
  // Shows/hides a tab on the form.
  // Example usage:
  // CrmHelpers.toggleTab(executionContext, "account_type", "Partner", "tab_services");
  toggleTab: function (executionContext, triggerField, matchValue, tabName) {
    var formContext = executionContext.getFormContext();
    var attribute = formContext.getAttribute(triggerField);
    if (!attribute) return;

    var tab = formContext.ui.tabs.get(tabName);
    if (tab) tab.setVisible(CrmHelpers._matches(attribute, matchValue));
  },

  // ==============================
  // toggleSection
  // ==============================
  // Shows/hides a section within a tab.
  // Example usage:
  // CrmHelpers.toggleSection(executionContext, "account_type", 100000001, "tab_services", "section_partners");
  toggleSection: function (executionContext, triggerField, matchValue, tabName, sectionName) {
    var formContext = executionContext.getFormContext();
    var attribute = formContext.getAttribute(triggerField);
    if (!attribute) return;

    var section = formContext.ui.tabs.get(tabName)?.sections.get(sectionName);
    if (section) section.setVisible(CrmHelpers._matches(attribute, matchValue));
  },

  // ==============================
  // toggleSubgrid
  // ==============================
  // Shows/hides a subgrid. If requireEmpty is true and the grid has rows
  // when hiding, alerts the user and reverts the trigger field to its
  // previous value. Requires trackInitialValue on form load for revert.
  // Example usage:
  // CrmHelpers.toggleSubgrid(executionContext, "account_type", "Partner", "PartnerGrid", true);
  // CrmHelpers.toggleSubgrid(executionContext, "account_type", 100000001, "PartnerGrid", false);
  toggleSubgrid: function (executionContext, triggerField, matchValue, subgridName, requireEmpty) {
    var formContext = executionContext.getFormContext();
    var attribute = formContext.getAttribute(triggerField);
    if (!attribute) return;

    var subgrid = formContext.ui.controls.get(subgridName);
    if (!subgrid || !subgrid.getGrid) return;

    var match = CrmHelpers._matches(attribute, matchValue);
    var oldValue = CrmHelpers.previousValues[triggerField];
    var fieldLabel = formContext.getControl(triggerField)?.getLabel() || triggerField;

    if (!match && requireEmpty) {
      var rows = subgrid.getGrid().getRows();

      if (rows.getLength() > 0) {
        var confirmStrings = {
          text: `You cannot change the value of '${fieldLabel}' while there are still records in the related subgrid. Please remove those records first.`,
          title: "Please Clear Related Records"
        };
        var confirmOptions = { height: 200, width: 500 };

        // Note: setValue triggers another OnChange. Handlers will re-run
        // against the reverted value, which is the intended behaviour.
        Xrm.Navigation.openAlertDialog(confirmStrings, confirmOptions).then(function () {
          attribute.setValue(oldValue);
        });

        return;
      }
    }

    subgrid.setVisible(match);
    CrmHelpers.previousValues[triggerField] = attribute.getValue();
  },

  // ==============================
  // trackInitialValue
  // ==============================
  // Call on form load to record the original field value. Required
  // for toggleSubgrid's revert behaviour to work.
  // Example usage:
  // CrmHelpers.trackInitialValue(executionContext, "account_type");
  trackInitialValue: function (executionContext, fieldName) {
    var formContext = executionContext.getFormContext();
    var attr = formContext.getAttribute(fieldName);
    if (attr) {
      CrmHelpers.previousValues[fieldName] = attr.getValue();
    }
  },
};