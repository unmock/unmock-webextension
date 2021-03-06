import { browser } from "webextension-polyfill-ts";
import messageHandler from "./handlers";
import { checkAndCacheApiCheckResult, getPageContent } from "./utils";
import * as messages from "../messages";
import debug from "../common/logging";
import { sender } from "../browser";

const debugLog = debug("unmock:content-script");
debugLog("Running content script.");

const onLoad = async () => {
  const pageContent = getPageContent();
  const isApi = await checkAndCacheApiCheckResult(pageContent);
  sender.sendRuntimeMessage({
    type: messages.MessageType.SET_BADGE,
    props: {
      isApi,
    },
  });
};

window.onload = onLoad;

browser.runtime.onMessage.addListener(messageHandler);
