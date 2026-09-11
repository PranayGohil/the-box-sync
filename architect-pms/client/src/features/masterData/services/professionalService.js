import { fetchAPI } from '../../../services/api';

export const getProfessionals = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return await fetchAPI(`/professionals${query ? `?${query}` : ''}`);
};

export const createProfessional = async (data) => {
  return await fetchAPI('/professionals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateProfessional = async (id, data) => {
  return await fetchAPI(`/professionals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteProfessional = async (id) => {
  return await fetchAPI(`/professionals/${id}`, {
    method: 'DELETE',
  });
};
