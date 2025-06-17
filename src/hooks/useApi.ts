import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || '';

// User hooks
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { email: string; name?: string }) => {
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// Talk hooks
export const useTalks = () => {
  return useQuery({
    queryKey: ['talks'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/talks`);
      if (!response.ok) throw new Error('Failed to fetch talks');
      return response.json();
    },
  });
};

export const useCreateTalk = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      speakerId: string;
      date: string;
      duration: number;
    }) => {
      const response = await fetch(`${API_URL}/api/talks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create talk');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talks'] });
    },
  });
};
