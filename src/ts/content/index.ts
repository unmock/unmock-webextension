import { browser } from "webextension-polyfill-ts";
import messageHandler from "./handlers";
import { checkAndCacheApiCheckResult } from "./utils";
import * as messages from "../messages";
import debug from "../common/logging";
import { sender } from "../browser";

const debugLog = debug("unmock:content-script");
debugLog("Running content script.");

const onLoad = async () => {
  const isApi = await checkAndCacheApiCheckResult();
  sender.sendRuntimeMessage({
    type: messages.MessageType.SET_BADGE,
    props: {
      isApi,
    },
  });
};

window.onload = onLoad;

browser.runtime.onMessage.addListener(messageHandler);
