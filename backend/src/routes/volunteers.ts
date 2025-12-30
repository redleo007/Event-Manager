import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { successResponse } from '../utils/response';
import * as volunteerService from '../services/volunteerService';
import { validateVolunteerData } from '../utils/validation';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    validateVolunteerData(req.body);
    const volunteer = await volunteerService.createVolunteer({
      ...req.body,
      joined_date: new Date().toISOString(),
    });
    res.status(201).json(successResponse(volunteer));
  })
);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const sortBy = (req.query.sort as 'newest' | 'oldest') || 'newest';
    const volunteers = await volunteerService.getVolunteers(sortBy);
    res.json(successResponse(volunteers));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const volunteer = await volunteerService.getVolunteerById(req.params.id);
    res.json(successResponse(volunteer));
  })
);

router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const volunteer = await volunteerService.updateVolunteer(req.params.id, req.body);
    res.json(successResponse(volunteer));
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await volunteerService.deleteVolunteer(req.params.id);
    res.json(successResponse({ message: 'Volunteer deleted successfully' }));
  })
);

export default router;
