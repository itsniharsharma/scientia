import { Request, Response, NextFunction } from 'express';
import * as OrganisationsService from './organisations.service';

export async function registerOrganisation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const organisation = await OrganisationsService.registerOrganisation(req.body);
    res.status(201).json(organisation);
  } catch (err) {
    next(err);
  }
}

export async function listOrganisations(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const organisations = await OrganisationsService.listOrganisations();
    res.json(organisations);
  } catch (err) {
    next(err);
  }
}

export async function listMyOrganisations(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const organisations = await OrganisationsService.listMyOrganisations(req.user!.userId);
    res.json(organisations);
  } catch (err) {
    next(err);
  }
}

export async function joinOrganisation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const membership = await OrganisationsService.joinOrganisation(
      req.user!.userId,
      req.params.organisationId,
    );
    res.status(201).json(membership);
  } catch (err) {
    next(err);
  }
}

export async function assignStudent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const assignment = await OrganisationsService.assignStudentToOrganisation(
      req.params.organisationId,
      req.user!.userId,
      req.body,
    );
    res.status(201).json(assignment);
  } catch (err) {
    next(err);
  }
}

export async function listOrganisationStudents(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const students = await OrganisationsService.listOrganisationStudents(
      req.params.organisationId,
      req.user!.userId,
    );
    res.json(students);
  } catch (err) {
    next(err);
  }
}
