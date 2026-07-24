/**
 * SMS is a single-function seam. No SMS provider is wired up by default —
 * plug in Twilio/SNS/etc. here without touching any caller.
 */
export async function sendSms(to: string, body: string) {
  console.log(`[sms:dev] to=${to} body="${body}"`);
}
