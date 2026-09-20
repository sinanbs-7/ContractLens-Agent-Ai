import React from 'react';
import { Contract } from '../lib/api.js';
import { VersionDiffStudio } from '../components/VersionDiffStudio.js';
import { GitCompare } from 'lucide-react';

interface VersionDiffProps {
  contracts: Contract[];
}

export const VersionDiff: React.FC<VersionDiffProps> = ({ contracts }) => {
  return (
    <div className="space-y-6 pb-12">
      <VersionDiffStudio contracts={contracts} />
    </div>
  );
};
