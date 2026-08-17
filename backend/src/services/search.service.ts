import { SearchRepository } from '../repositories/search.repository';
import { SearchQueryDTO, SearchTypeFilter } from '../validations/search.validation';

export interface SearchResultsPayload {
  query: string;
  totalResults: number;
  durationMs: number;
  counts: {
    projects: number;
    tasks: number;
    comments: number;
    members: number;
  };
  projects: any[];
  tasks: any[];
  comments: any[];
  members: any[];
}

export class SearchService {
  private searchRepo: SearchRepository;

  constructor() {
    this.searchRepo = new SearchRepository();
  }

  async search(orgId: string, queryDTO: SearchQueryDTO): Promise<SearchResultsPayload> {
    const startTime = performance.now();
    const query = queryDTO.q.trim();
    const limit = queryDTO.limit || 10;
    const type = queryDTO.type || SearchTypeFilter.ALL;
    const projectId = queryDTO.projectId;

    if (!query) {
      return {
        query: '',
        totalResults: 0,
        durationMs: 0,
        counts: { projects: 0, tasks: 0, comments: 0, members: 0 },
        projects: [],
        tasks: [],
        comments: [],
        members: [],
      };
    }

    // Execute queries in parallel based on requested type filter
    const shouldFetchProjects = type === SearchTypeFilter.ALL || type === SearchTypeFilter.PROJECTS;
    const shouldFetchTasks = type === SearchTypeFilter.ALL || type === SearchTypeFilter.TASKS;
    const shouldFetchComments = type === SearchTypeFilter.ALL || type === SearchTypeFilter.COMMENTS;
    const shouldFetchMembers = type === SearchTypeFilter.ALL || type === SearchTypeFilter.MEMBERS;

    const [projects, tasks, comments, members] = await Promise.all([
      shouldFetchProjects ? this.searchRepo.searchProjects(orgId, query, limit) : Promise.resolve([]),
      shouldFetchTasks ? this.searchRepo.searchTasks(orgId, query, limit, projectId) : Promise.resolve([]),
      shouldFetchComments ? this.searchRepo.searchComments(orgId, query, limit, projectId) : Promise.resolve([]),
      shouldFetchMembers ? this.searchRepo.searchMembers(orgId, query, limit) : Promise.resolve([]),
    ]);

    const durationMs = Math.round(performance.now() - startTime);
    const totalResults = projects.length + tasks.length + comments.length + members.length;

    return {
      query,
      totalResults,
      durationMs,
      counts: {
        projects: projects.length,
        tasks: tasks.length,
        comments: comments.length,
        members: members.length,
      },
      projects,
      tasks,
      comments,
      members,
    };
  }
}

export const globalSearchService = new SearchService();
