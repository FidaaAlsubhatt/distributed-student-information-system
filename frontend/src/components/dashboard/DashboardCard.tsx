import React, { ReactNode } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface DashboardCardProps {
  title: string;
  children: ReactNode;
  footerLink?: {
    url: string;
    text: string;
  };
  className?: string;
  headerClassName?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  children,
  footerLink,
  className = '',
  headerClassName = ''
}) => {
  return (
    <Card className={`shadow-sm overflow-hidden rounded-lg ${className}`}>
      <CardHeader className={`bg-white border-b border-gray-100 px-5 py-3.5 ${headerClassName}`}>
        <CardTitle className="text-base font-medium text-gray-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-gray-100 bg-white p-0">
        {children}
      </CardContent>
      {footerLink && (
        <CardFooter className="bg-white border-t border-gray-100 px-5 py-3 flex justify-end">
          <Link href={footerLink.url}>
            <Button variant="link" className="text-sm text-[#1d7a85] hover:text-[#1d7a85]/80 p-0">
              {footerLink.text}
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
};

export default DashboardCard;
