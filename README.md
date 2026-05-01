# CrmHelpers

One script. Drop on any Dynamics 365 form. Hides fields, sections, tabs, and subgrids based on a trigger field value.

Because every project has the same conversation. "Can we hide that field unless..." "Can this tab only show when..." Yea. All of it.

## What It Does

Five functions on a single object. Each one takes the execution context, the field that triggers the change, the value to match against, and whatever you're hiding or showing.

- `toggleControl` — show/hide a single field
- `toggleSection` — show/hide a section in a tab
- `toggleTab` — show/hide a whole tab
- `toggleSubgrid` — show/hide a subgrid, with optional "make sure it's empty first" prompt
- `trackInitialValue` — call on form load so the subgrid revert works

## The Match Logic

You can pass the option set value as a number, the value as a string, or the label itself. All three work.

```js
CrmHelpers.toggleControl(executionContext, "account_type", 100000001, "new_description");
CrmHelpers.toggleControl(executionContext, "account_type", "100000001", "new_description");
CrmHelpers.toggleControl(executionContext, "account_type", "Partner", "new_description");
```

So you don't have to remember whether it's the value or the label, just give it whatever you've got.

## Setup

1. Add `CrmHelpers.js` as a JavaScript web resource in your solution
2. Add the web resource to the form library
3. On form `OnLoad`, call `trackInitialValue` for any field you'll be using with `toggleSubgrid`
4. On the trigger field's `OnChange`, call whichever toggle function you need
5. Pass execution context as the first parameter (tick the box in the handler config)

## Usage

```js
// OnLoad
CrmHelpers.trackInitialValue(executionContext, "account_type");

// OnChange of account_type
CrmHelpers.toggleControl(executionContext, "account_type", "Partner", "new_description");
CrmHelpers.toggleSection(executionContext, "account_type", "Partner", "tab_services", "section_partners");
CrmHelpers.toggleTab(executionContext, "account_type", "Partner", "tab_services");
CrmHelpers.toggleSubgrid(executionContext, "account_type", "Partner", "PartnerGrid", true);
```

Three rules, four lines. No copy-pasting twenty lines of `getAttribute` / `getValue` / `setVisible` boilerplate per form.

## The Subgrid One

This is where it earns its keep. Hiding a subgrid is fine. Hiding a subgrid that already has records in it is a problem, because the user thinks they're gone, but the data's still sat there in the related table.

`toggleSubgrid` has a `requireEmpty` flag. If it's true, and someone tries to change the field while there are still rows in the grid, it pops an alert telling them to clear the records first, and reverts the field back to its previous value. That's why `trackInitialValue` exists.

```js
// Will block the change and revert if PartnerGrid has rows
CrmHelpers.toggleSubgrid(executionContext, "account_type", "Partner", "PartnerGrid", true);

// Will just hide silently regardless of contents
CrmHelpers.toggleSubgrid(executionContext, "account_type", "Partner", "PartnerGrid", false);
```

## Known Limitations

- **Single-select option sets only.** Multi-select fields return an array from `getValue()` and the match logic doesn't handle that yet
- **`previousValues` is keyed by field name only.** If the same field name drives things across multiple forms in one session, the keys collide. Prob fine for most cases, worth knowing
- **Subgrid revert fires another OnChange.** Setting the field back to its old value re-triggers your handlers. That's intended, but if you've got side effects in there, be aware

## Why Not Just Use Business Rules

Business rules cover some of this. The maker config panel covers a bit more. But once you've got more than a couple of conditions, or you want to do something the UI doesn't expose (like the empty-check on a subgrid), you're back in JS anyway.

So if you're writing script, you might as well write it once.

## Licence

MIT. Do what you like with it.
