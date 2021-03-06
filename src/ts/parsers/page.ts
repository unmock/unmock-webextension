import { PageContent } from "../common/types";
import {
  OpenApiBuilder,
  OpenAPIObject,
  PathsObject,
  OperationObject,
  PathItemObject,
} from "openapi3-ts";
import { merge as _merge } from "lodash";
import * as _ from "lodash";
import * as SwaggerParser from "swagger-parser";
import debug from "../common/logging";
import { cleanPathAndExtractParameters } from "./paths";

const debugLog = debug("unmock:parsers:page");

const specBase = {
  openapi: "3.0.0",
  info: {
    version: "1",
    title: "API title",
  },
  paths: {},
};

const operationBase: OperationObject = {
  responses: {
    200: {
      description: "OK",
    },
  },
};

/**
 * Pattern for matching expressions like
 * GET /v1/pets
 * PUT /v2/:id
 * DELETE /v1/(int: id)
 */
export const httpCallPattern = /(GET|POST|DELETE|PUT)\s((?:\/(?:[\w:]+|\([\w:\s]+\)|))+)/g;

export const parsePathsObjectFromHttpCallMatch = (
  match: RegExpExecArray
): PathsObject => {
  const path = { name: match[2], pathParameters: [] };
  const cleanedPath = cleanPathAndExtractParameters(path);
  const operationName = match[1].toLowerCase();
  const operation = _merge({}, operationBase, {
    parameters: cleanedPath.pathParameters,
  });
  const pathItem: PathItemObject = { [operationName]: operation };
  return { [cleanedPath.name]: pathItem };
};

export const parsePathsFromPage = (pageContent: PageContent): PathsObject => {
  let paths: PathsObject = {};
  let patternExecResult = httpCallPattern.exec(pageContent.textContent);

  while (patternExecResult !== null) {
    const fullMatch: RegExpExecArray = patternExecResult;
    const pathsObject = parsePathsObjectFromHttpCallMatch(fullMatch);
    paths = _merge({}, paths, pathsObject);
    patternExecResult = httpCallPattern.exec(pageContent.textContent);
  }
  debugLog(`Got paths`, paths);
  return paths;
};

export const buildSpecFrom = async (
  pageContent: PageContent
): Promise<OpenAPIObject> => {
  const paths = parsePathsFromPage(pageContent);
  const specFromPage = {
    info: {
      title: pageContent.title,
    },
    paths,
  };
  const options = _merge({}, specBase, specFromPage);
  await SwaggerParser.validate(options as any);
  return OpenApiBuilder.create(options).getSpec();
};
