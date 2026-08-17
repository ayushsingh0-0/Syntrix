import { Request, Response } from 'express';
import { globalSearchService } from '../services/search.service';
import { searchSchema } from '../validations/search.validation';

const getParam = (param: string | string[] | undefined): string => {
  return Array.isArray(param) ? param[0] : (param || '');
};

export class SearchController {
  search = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const validated = searchSchema.parse(req.query);

    const results = await globalSearchService.search(orgId, validated);

    res.status(200).json({
      status: 'success',
      data: results,
    });
  };
}

export const searchController = new SearchController();
