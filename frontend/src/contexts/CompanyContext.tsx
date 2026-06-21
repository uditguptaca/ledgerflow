'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';

export interface Company {
  id: string;
  name: string;
  currency: string;
  role?: string;
  createdAt?: string;
}

interface CompanyContextType {
  companies: Company[];
  currentCompany: Company | null;
  isLoading: boolean;
  selectCompany: (companyId: string) => void;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshCompanies = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const companyList = await api.get<Company[]>('/v1/companies');
      setCompanies(companyList);

      if (companyList.length > 0) {
        const savedId = localStorage.getItem('ledgerflow_company_id');
        const match = companyList.find((c) => c.id === savedId);
        if (match) {
          setCurrentCompany(match);
        } else {
          setCurrentCompany(companyList[0]);
          localStorage.setItem('ledgerflow_company_id', companyList[0].id);
        }
      } else {
        setCurrentCompany(null);
        localStorage.removeItem('ledgerflow_company_id');
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshCompanies();
    } else {
      setCompanies([]);
      setCurrentCompany(null);
    }
  }, [isAuthenticated]);

  const selectCompany = (companyId: string) => {
    const match = companies.find((c) => c.id === companyId);
    if (match) {
      setCurrentCompany(match);
      localStorage.setItem('ledgerflow_company_id', companyId);
      // Trigger full page refresh or component rerender depending on app shell design
      window.location.reload();
    }
  };

  const value: CompanyContextType = {
    companies,
    currentCompany,
    isLoading,
    selectCompany,
    refreshCompanies,
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
};

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
