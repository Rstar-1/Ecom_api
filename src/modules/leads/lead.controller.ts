import { HTTP_STATUS } from "../../constants";
import type { ApiHandler, EmptyParams, IdParams } from "../../types/http";
import { successResponse, toBool } from "../../utils";
import type { DeleteQuery, LeadBody, LeadListQuery, SeverityBody } from "./lead.types";
import * as service from "./lead.service";

/* POST /api/leads (public: website contact form; JSON or form-data) */
export const createLead: ApiHandler<EmptyParams, LeadBody> = async (req, res, next) => {
  try {
    const data = await service.createLead(req.body ?? {}, req.user?.id);
    successResponse(res, data, "Lead created", HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/* GET /api/leads?page=&limit=&search=&severity=&publishedStatus=&isDeleted= */
export const getLeads: ApiHandler<EmptyParams, never, LeadListQuery> = async (req, res, next) => {
  try {
    const data = await service.getLeads(req.query);
    successResponse(res, data, "Leads fetched");
  } catch (error) {
    next(error);
  }
};

/* GET /api/leads/:id */
export const getLeadById: ApiHandler<IdParams> = async (req, res, next) => {
  try {
    const data = await service.getLeadById(req.params.id);
    successResponse(res, data, "Lead fetched");
  } catch (error) {
    next(error);
  }
};

/* PUT|PATCH /api/leads/:id */
export const updateLead: ApiHandler<IdParams, LeadBody> = async (req, res, next) => {
  try {
    const data = await service.updateLead(req.params.id, req.body ?? {});
    successResponse(res, data, "Lead updated");
  } catch (error) {
    next(error);
  }
};

/* PATCH /api/leads/:id/severity { severity } */
export const updateLeadSeverity: ApiHandler<IdParams, SeverityBody> = async (req, res, next) => {
  try {
    const data = await service.updateLeadSeverity(req.params.id, req.body?.severity);
    successResponse(res, data, "Lead severity updated");
  } catch (error) {
    next(error);
  }
};

/* DELETE /api/leads/:id?permanent=true */
export const deleteLead: ApiHandler<IdParams, never, DeleteQuery> = async (req, res, next) => {
  try {
    const data = await service.deleteLead(req.params.id, toBool(req.query.permanent));
    successResponse(res, data, "Lead deleted");
  } catch (error) {
    next(error);
  }
};

/* POST|DELETE /api/leads/bulk-delete { ids, permanent? } */
export const bulkDeleteLeads: ApiHandler<EmptyParams, unknown> = async (req, res, next) => {
  try {
    const data = await service.bulkDeleteLeads(req.body);
    successResponse(res, data, "Leads deleted successfully");
  } catch (error) {
    next(error);
  }
};
