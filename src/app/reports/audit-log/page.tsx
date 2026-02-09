'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import AppContent from '@/components/layout/app-content';
import { useApp, type AppUser } from '@/context/app-context';
import { getAuditLogs, type AuditLogReportEntry } from '@/actions/audit';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';


export default function AuditLogReportPage() {
    const { user, users, isAuthenticated, isLoading } = useApp();
    const router = useRouter();
    const { toast } = useToast();

    const [fromDate, setFromDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedUserId, setSelectedUserId] = useState('all');
    const [auditLogs, setAuditLogs] = useState<AuditLogReportEntry[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    
    useEffect(() => {
        if (!isLoading && (!isAuthenticated || !['Manager', 'Admin', 'Super Admin'].includes(user?.role as string))) {
          router.replace('/dashboard');
        }
    }, [isAuthenticated, user, isLoading, router]);

    const handleFetchLogs = async () => {
        setIsFetching(true);
        try {
            const from = new Date(fromDate);
            from.setHours(0, 0, 0, 0);

            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);

            if (from > to) {
                toast({
                    variant: 'destructive',
                    title: 'Invalid Date Range',
                    description: 'The "From Date" cannot be after the "To Date".'
                });
                return;
            }

            const logs = await getAuditLogs(
                from,
                to,
                selectedUserId === 'all' ? undefined : selectedUserId
            );
            setAuditLogs(logs);

            toast({
                title: 'Logs Fetched',
                description: `${logs.length} audit log entries found.`,
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Error Fetching Logs',
                description: 'An unexpected error occurred while fetching the audit logs.',
            });
        } finally {
            setIsFetching(false);
        }
    };
    
    if (isLoading || !isAuthenticated || !['Manager', 'Admin', 'Super Admin'].includes(user?.role as string)) {
        return null;
    }

    return (
        <AppContent>
            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader className="bg-primary/10">
                        <CardTitle className="text-center text-primary">Audit Log Report</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="fromDate">From Date</Label>
                                <Input
                                    id="fromDate"
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="toDate">To Date</Label>
                                <Input
                                    id="toDate"
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="employee">Employee</Label>
                                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                    <SelectTrigger id="employee" className="w-[220px]">
                                        <SelectValue placeholder="Select an employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Employees</SelectItem>
                                        {users.map(u => (
                                            <SelectItem key={u.id} value={u.id}>{u.username}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleFetchLogs} disabled={isFetching}>
                                {isFetching ? 'Fetching...' : 'Fetch Logs'}
                            </Button>
                        </div>

                        <Card>
                             <CardHeader>
                                <CardTitle className="text-lg">Log Entries ({auditLogs.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-96 w-full rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Timestamp</TableHead>
                                                <TableHead>Username</TableHead>
                                                <TableHead>Action</TableHead>
                                                <TableHead>Entity</TableHead>
                                                <TableHead>Entity ID</TableHead>
                                                <TableHead>Details</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {auditLogs.length > 0 ? (
                                                auditLogs.map(log => (
                                                    <TableRow key={log.id}>
                                                        <TableCell>{format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                                                        <TableCell>{log.username}</TableCell>
                                                        <TableCell>{log.action}</TableCell>
                                                        <TableCell>{log.targetEntityType || 'N/A'}</TableCell>
                                                        <TableCell>{log.targetEntityId || 'N/A'}</TableCell>
                                                        <TableCell className="max-w-sm truncate">{log.details || 'N/A'}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-24 text-center">
                                                        No logs found for the selected criteria.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </CardContent>
                </Card>
            </div>
        </AppContent>
    );
}
