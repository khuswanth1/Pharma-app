import apiClient from './apiClient';

export const getAddressesAPI = async (userId) => {
  try {
    const response = await apiClient.get(`/api/auth/addresses/user/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch addresses.';
  }
};

export const addAddressAPI = async (addressData) => {
  try {
    const response = await apiClient.post('/api/auth/addresses', addressData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to add address.';
  }
};

export const updateAddressAPI = async (id, addressData) => {
  try {
    const response = await apiClient.put(`/api/auth/addresses/${id}`, addressData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update address.';
  }
};

export const deleteAddressAPI = async (id) => {
  try {
    const response = await apiClient.delete(`/api/auth/addresses/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete address.';
  }
};

export const setPrimaryAddressAPI = async (id, userId) => {
  try {
    const response = await apiClient.put(`/api/auth/addresses/primary/${id}/user/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to set primary address.';
  }
};
