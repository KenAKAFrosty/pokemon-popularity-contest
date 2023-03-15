import { RequestHandler } from "@builder.io/qwik-city";
import { getUuId } from "~/generic-utilities";

export const onGet: RequestHandler = async (context) => {
    context.text(200, getUuId())
}