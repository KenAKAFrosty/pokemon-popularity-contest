const sid = import.meta.env.VITE_TWILIO_ACCOUNT_SID || process.env.VITE_TWILIO_ACCOUNT_SID;
const token = import.meta.env.VITE_TWILIO_AUTH_TOKEN || process.env.VITE_TWILIO_AUTH_TOKEN;

const verificationServiceSid = "VAf7dd8eaf72cf9f5de9883cfdf85f5ee3"
const defaultHeaders = {
    "Authorization": `Basic ${btoa(`${sid}:${token}`)})`,
    "content-type": "application/x-www-form-urlencoded"
}

export async function sendToken(phoneNumber: string) {
    const url = new URL(`https://verify.twilio.com/v2/Services/${verificationServiceSid}/Verifications/`);
    const body = new URLSearchParams();
    body.append("To", phoneNumber);
    body.append("Channel", "sms");
    return await fetch(url.toString(), {
        headers: defaultHeaders,
        method: "POST",
        body
    }).then(raw => raw.json());
}

export async function checkToken(inputs: {
    phoneNumber: string,
    code: string
}) {
    const url = new URL("https://verify.twilio.com/v2/Services/VAf7dd8eaf72cf9f5de9883cfdf85f5ee3/VerificationCheck");
    const verificationBody = new URLSearchParams();
    verificationBody.append("To", inputs.phoneNumber);
    verificationBody.append("Code", inputs.code)
    return await fetch(url.toString(), {
        headers: defaultHeaders,
        method: "POST",
        body: verificationBody
    }).then(raw => raw.json()) as CheckTokenResponse;
}


type CheckTokenResponse = typeof checkTokenResponseExample;
const checkTokenResponseExample = {
    "status": "approved",
    "payee": null,
    "date_updated": "2023-03-15T03:15:31Z",
    "account_sid": "AC78d7be9faeb699e14876d1f914e15a03",
    "to": "+15551231234",
    "amount": null,
    "valid": true,
    "sid": "VE60de78d97d8b4a4a7aed2b1a111e44e2",
    "date_created": "2023-03-15T03:15:23Z",
    "service_sid": "VAf7dd8eaf72cf9f5de9883cfdf85f5ee3",
    "channel": "sms"
}