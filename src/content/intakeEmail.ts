// Intake email template. Edit the wording here; no code changes needed elsewhere.
// Placeholders: {{firstName}} {{date}} {{dateTime}} {{portalUrl}} {{helpUrl}} {{exampleUrl}}
// Keep the "Request a nurse call" option near the top (peer feedback).

export const INTAKE_EMAIL_SUBJECT =
  "Action needed: Complete your new patient intake form before your appointment on {{date}}";

export const INTAKE_EMAIL_HTML = `
<p>Hello {{firstName}},</p>

<p>Your first appointment at the Cancer Centre is on <strong>{{dateTime}}</strong>.
Before then, please complete your new patient intake form online.
It takes about 20 to 30 minutes and you can save and come back later.</p>

<div class="email-callout">
  <p class="email-callout-title">Prefer to do this over the phone?</p>
  <p><a class="email-link-strong" href="{{helpUrl}}">Request a nurse call</a> and a nurse will call you 1 to 2 days before your appointment.</p>
</div>

<p><strong>How to complete the form online:</strong></p>
<ol>
  <li>Click the button below to log in or sign up for MyConnectedCare.</li>
  <li>Click <strong>"Questionnaires"</strong> on the left.</li>
  <li>Click <strong>"Start Intake Form"</strong>.</li>
</ol>

<p><a class="email-button" href="{{portalUrl}}">Open MyConnectedCare</a></p>

<p>Not sure how to answer? <a href="{{exampleUrl}}">See an example of a completed form</a></p>

<p><strong>Please complete the form before your appointment on {{date}}.</strong></p>

<p>Please bring an official list of your current medications to your appointment.</p>

<p>Thank you,<br/>New Patient Intake Team<br/>Cancer Centre</p>
`;
