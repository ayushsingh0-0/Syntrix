import { getHealthData } from '../repositories/health.repository';

export const getHealthStatus = () => {
  return getHealthData();
};
