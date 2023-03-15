import { component$, useSignal } from '@builder.io/qwik';
import { DocumentHead, server$ } from '@builder.io/qwik-city';
import { checkToken, sendToken } from '~/twilio/verification';
const testPhoneNumber = import.meta.env.VITE_TEST_PHONE_NUMBER;

const frontendSendToken = server$(async (phoneNumber: string) => {
  const phoneNumberToUse = phoneNumber === "test" ? testPhoneNumber : phoneNumber;
  return sendToken(phoneNumberToUse);
});
const frontendCheckToken = server$(async (inputs: { code: string, phoneNumber: string }) => {
  const { phoneNumber, code } = inputs;
  const phoneNumberToUse = phoneNumber === "test" ? testPhoneNumber : phoneNumber;
  return checkToken({
    code,
    phoneNumber: phoneNumberToUse
  });
});
export default component$(() => {

  const phoneNumberSignal = useSignal("");
  const codeSignal = useSignal("");
  return (<main>
    <h1>Pokémon Popularity Contest</h1>
    <p>phone number</p>
    <input
      value={phoneNumberSignal.value}
      onChange$={event => {
        phoneNumberSignal.value = event.target.value;
      }} />
    <button
      onClick$={async () => {
        const result = await frontendSendToken(phoneNumberSignal.value);
        console.log(result)
      }}
    >
      Send token
    </button>

    <p>verify token</p>
    <input
      value={codeSignal.value}
      onChange$={event => {
        codeSignal.value = event.target.value;
      }}
    />
    <button
      onClick$={async () => {
        const result = await frontendCheckToken({ code: codeSignal.value, phoneNumber: phoneNumberSignal.value });
        console.log(result)
      }}
    >
      Verify
    </button>

  </main>);
});

export const head: DocumentHead = {
  title: 'Pokémon Popularity Contest',
  meta: [
    {
      name: 'description',
      content: 'Speedran live on Twitch',
    },
  ],
};
