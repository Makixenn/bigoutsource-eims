# Implementation of Special Characters Shortcodes & Bug Fixes

## Changes and Additions
* **Special Character Shortcodes**: Added a new `applySpecialShortcodes` utility function in `frontend/src/lib/utils.ts` to automatically convert specific bracket-based shortcodes into accented characters on-the-fly.
* **Supported Characters**:
  * ``[`a]`` ➔ á (and ``[`A]`` ➔ Á)
  * ``[`e]`` ➔ é (and ``[`E]`` ➔ É)
  * ``[`i]`` ➔ í (and ``[`I]`` ➔ Í)
  * ``[`o]`` ➔ ó (and ``[`O]`` ➔ Ó)
  * ``[`u]`` ➔ ú (and ``[`U]`` ➔ Ú)
  * ``[`n]`` ➔ ñ (and ``[`N]`` ➔ Ñ)
* **UI Integration**: Integrated the shortcode utility into the "Full Name" input in `RegisterForm.tsx`, the Add Employee Wizard in `Directory.tsx`, and the editable name fields in `EmployeeProfile.tsx`.
* **Helper Text**: Updated the helper text below the registration name field to inform users of the available shortcodes.
* **UI Cleanup**: Removed the clunky "ñ" UI buttons and legacy `onAppendSpecialChar` props from the employee profile and directory inputs to favor the cleaner, keyboard-first shortcode approach.

---

## Problems Encountered & Solutions

### 1. White Screen / Fatal Build Error Crash
* **Problem**: Attempting to add an escaped single quote (`\'`) inside a unicode-flagged Regular Expression (`/u`) in the name validation logic caused a fatal `SyntaxError: Invalid escape` during the Vite build. This completely crashed the frontend, resulting in a white screen.
* **Solution**: Reverted the regex syntax to properly use unescaped single quotes within the character class (e.g., `/[^\p{L}\-'\s]/u`). 

### 2. Character Blocking Prevented Shortcode Typing
* **Problem**: The strict, real-time `onChange` regex validation in `Directory.tsx` and `EmployeeProfile.tsx` immediately blocked the typing of bracket (`[`, `]`) and backtick (`` ` ``) characters. Because of this, users physically could not type the shortcode out to trigger the auto-replacement.
* **Solution**: Updated the `onChange` regex to temporarily allow brackets and backticks in the input fields (`/[^\p{L}\-'\s\[\]`]/u`). To ensure data integrity, strict validation was added to the final submit/save handlers (`validationForStep` and `saveProfile`) to prevent users from accidentally saving a name with an incomplete shortcode.

### 3. TypeScript Regressions & Missing Types
* **Problem**: A `dateHired` field had been added in an earlier commit but was lost from the TypeScript definitions during file modifications/reverts. This resulted in several TypeScript build errors (`TS2339` and `TS2322`) for missing properties in `AddEmployeeForm` and `Employee` mapping objects. Additionally, API service methods (`list`) were strictly rejecting parameters.
* **Solution**: Restored `dateHired` to `AddEmployeeForm` and the `normalizeEmployee` function in `Directory.tsx`. Updated `employeeService.js` and `deviceService.js` to correctly accept and format the `params` argument, fully resolving all TypeScript build warnings.
