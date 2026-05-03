import {
  Shield,
  CheckCircle,
  XCircle,
  Users,
  Clock,
  FileText,
  Database,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApprovals, type PendingChange } from "@/hooks/useApprovals";

interface UserRecord {
  github_login: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

const ITEMS_PER_PAGE = 10;

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<UserRecord[]>([]);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingChange[]>([]);
  const [changeLog, setChangeLog] = useState<PendingChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [changeLogPage, setChangeLogPage] = useState(1);
  const [expandedPayloads, setExpandedPayloads] = useState<Set<number>>(
    new Set(),
  );
  const {
    listChanges,
    reviewChange,
    applyChange,
    loading: approvalLoading,
    error: approvalError,
  } = useApprovals();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, allRes] = await Promise.all([
        fetch("/api/users/pending", { credentials: "include" }),
        fetch("/api/users", { credentials: "include" }),
      ]);
      if (pendingRes.ok) setPendingUsers(await pendingRes.json());
      if (allRes.ok) setAllUsers(await allRes.json());

      const changes = await listChanges({ status: "pending" });
      setPendingApprovals(changes);

      const allChanges = await listChanges({});
      setChangeLog(allChanges);
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  }, [listChanges]);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    loadData();
  }, [isAdmin, navigate, loadData]);

  useEffect(() => {
    if (approvalError) console.error("Approval error:", approvalError);
  }, [approvalError]);

  const handleApproveUser = async (github_login: string) => {
    try {
      const res = await fetch(`/api/users/${github_login}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to approve user");
      await loadData();
    } catch (error) {
      console.error("Error approving user:", error);
    }
  };

  const handleApproveChange = async (id: number) => {
    const result = await reviewChange(id, "approved");
    if (!result) {
      alert("Failed to approve change");
      return;
    }
    const applied = await applyChange(id);
    if (!applied) {
      alert("Failed to apply change");
      return;
    }
    await loadData();
  };

  const handleRejectChange = async (id: number) => {
    const result = await reviewChange(id, "rejected");
    if (!result) {
      alert("Failed to reject change");
      return;
    }
    await loadData();
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "variant":
        return <FileText className="h-4 w-4" />;
      case "gene":
        return <Database className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "update":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "delete":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "";
    }
  };

  const togglePayload = (id: number) => {
    setExpandedPayloads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const paginatedChangeLog = changeLog.slice(
    (changeLogPage - 1) * ITEMS_PER_PAGE,
    changeLogPage * ITEMS_PER_PAGE,
  );
  const totalPages = Math.ceil(changeLog.length / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header showSearch={false} />

      <div className="max-w-7xl mx-auto px-4 py-6 pt-12 flex-1 w-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-teal-600 rounded-xl shadow-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Admin Dashboard
            </h1>
            <p className="text-slate-500">
              Manage users, approvals, and system settings
            </p>
          </div>
        </div>

        <Tabs defaultValue="approvals">
          <TabsList className="mb-6 bg-white border border-slate-200 p-1.5 rounded-xl h-auto gap-1">
            <TabsTrigger
              value="approvals"
              className="px-5 py-2.5 rounded-lg data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <Clock className="h-4 w-4 mr-2" />
              Pending Approvals
              {pendingApprovals.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-slate-100 text-slate-600"
                >
                  {pendingApprovals.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="px-5 py-2.5 rounded-lg data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger
              value="changelog"
              className="px-5 py-2.5 rounded-lg data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <Database className="h-4 w-4 mr-2" />
              Change Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="approvals">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Clock className="h-5 w-5 text-teal-600" />
                  Curator Change Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : pendingApprovals.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                    <p>No pending approvals</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingApprovals.map((change) => (
                      <div
                        key={change.id}
                        className="border border-slate-200 bg-white rounded-lg p-4 hover:border-teal-200 transition-colors shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getEntityIcon(change.entity_type)}
                              <span className="font-semibold capitalize">
                                {change.entity_type}
                              </span>
                              <Badge
                                variant="outline"
                                className={getActionColor(change.action)}
                              >
                                {change.action}
                              </Badge>
                              <Badge variant="outline">{change.gene_id}</Badge>
                            </div>
                            <p className="text-sm text-slate-600 mb-1">
                              Requested by{" "}
                              <span className="font-medium">
                                {change.requested_by}
                              </span>{" "}
                              {new Date(
                                change.requested_at,
                              ).toLocaleDateString()}
                            </p>
                            <pre className="text-xs bg-slate-50 p-2 rounded mt-2 overflow-x-auto">
                              {JSON.stringify(change.payload, null, 2)}
                            </pre>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => {
                                console.log(
                                  "Approve button clicked for id:",
                                  change.id,
                                );
                                handleApproveChange(change.id);
                              }}
                              disabled={approvalLoading}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectChange(change.id)}
                              disabled={approvalLoading}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            {/* Pending Approvals */}
            {pendingUsers.length > 0 && (
              <Card className="mb-6 bg-white border border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Users className="h-5 w-5 text-teal-600" />
                    Pending User Approvals ({pendingUsers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {pendingUsers.map((user) => (
                      <div
                        key={user.github_login}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar>
                            {user.avatar_url && (
                              <AvatarImage
                                src={user.avatar_url}
                                alt={user.name}
                              />
                            )}
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-slate-500">
                              @{user.github_login}
                            </p>
                            <p className="text-sm text-slate-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleApproveUser(user.github_login)}
                          className="bg-teal-600 hover:bg-teal-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Users Table */}
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Users className="h-5 w-5 text-teal-600" />
                  All Users ({allUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers.map((user) => (
                        <TableRow key={user.github_login}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar size="sm">
                                {user.avatar_url && (
                                  <AvatarImage
                                    src={user.avatar_url}
                                    alt={user.name}
                                  />
                                )}
                                <AvatarFallback className="bg-teal-100 text-teal-700">
                                  {user.name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-slate-500">
                                  @{user.github_login}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.role === "admin"
                                  ? "default"
                                  : user.role === "curator"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-slate-500">
                            {new Date(user.updated_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="changelog">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Database className="h-5 w-5 text-teal-600" />
                  Approval / Change Log ({changeLog.length} entries)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : changeLog.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                    <p>No change history</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <div className="col-span-1">ID</div>
                      <div className="col-span-2">Action / Status</div>
                      <div className="col-span-2">Entity</div>
                      <div className="col-span-3">Payload</div>
                      <div className="col-span-2">Users</div>
                      <div className="col-span-2">Date / Notes</div>
                    </div>

                    {paginatedChangeLog.map((change) => (
                      <div
                        key={change.id}
                        className="block md:grid md:grid-cols-12 gap-4 p-4 bg-slate-50/50 hover:bg-slate-50 rounded-lg border border-slate-100 transition-colors"
                      >
                        {/* ID */}
                        <div className="col-span-1 font-mono text-xs text-slate-500 mb-2 md:mb-0">
                          #{change.id}
                        </div>

                        {/* Action / Status */}
                        <div className="col-span-2 flex flex-wrap gap-2 mb-2 md:mb-0">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold capitalize ${
                              change.action === "create"
                                ? "bg-emerald-100 text-emerald-700"
                                : change.action === "update"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {change.action}
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold capitalize ${
                              change.status === "approved"
                                ? "bg-teal-100 text-teal-700"
                                : change.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : change.status === "applied"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {change.status}
                          </span>
                        </div>

                        {/* Entity */}
                        <div className="col-span-2 mb-2 md:mb-0">
                          <Badge
                            variant="outline"
                            className="capitalize bg-white mb-1"
                          >
                            {change.entity_type}
                          </Badge>
                          <p className="text-sm text-slate-600">
                            {change.entity_id || change.gene_id}
                          </p>
                        </div>

                        {/* Payload - Clickable */}
                        <div className="col-span-3 mb-2 md:mb-0">
                          <button
                            onClick={() => togglePayload(change.id)}
                            className="flex items-center gap-2 text-xs text-slate-600 hover:text-teal-600 transition-colors"
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                expandedPayloads.has(change.id)
                                  ? "rotate-0"
                                  : "-rotate-90"
                              }`}
                            />
                            <span className="font-medium">
                              {expandedPayloads.has(change.id)
                                ? "Hide payload"
                                : "View payload"}
                            </span>
                          </button>
                          {expandedPayloads.has(change.id) && (
                            <pre className="mt-2 text-xs bg-white p-3 rounded border border-slate-200 overflow-x-auto max-h-60 text-slate-600">
                              {JSON.stringify(change.payload, null, 2)}
                            </pre>
                          )}
                        </div>

                        {/* Users */}
                        <div className="col-span-2 mb-2 md:mb-0">
                          <div className="text-sm">
                            <span className="text-slate-500">From: </span>
                            <span className="font-medium text-slate-700">
                              {change.requested_by}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-slate-500">By: </span>
                            <span
                              className={`font-medium ${
                                change.reviewed_by
                                  ? "text-slate-700"
                                  : "text-slate-400"
                              }`}
                            >
                              {change.reviewed_by || "— pending —"}
                            </span>
                          </div>
                        </div>

                        {/* Date / Notes */}
                        <div className="col-span-2">
                          <p className="text-xs text-slate-500">
                            Requested:{" "}
                            {new Date(change.requested_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(change.requested_at).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                          {change.reviewed_at && (
                            <p className="text-xs text-slate-500 mt-1">
                              Reviewed:{" "}
                              {new Date(
                                change.reviewed_at,
                              ).toLocaleDateString()}
                            </p>
                          )}
                          {change.review_notes && (
                            <p className="text-xs text-teal-600 mt-1 italic">
                              "{change.review_notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <p className="text-sm text-slate-500">
                          Page {changeLogPage} of {totalPages} (
                          {changeLog.length} total)
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setChangeLogPage((p) => Math.max(1, p - 1))
                            }
                            disabled={changeLogPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setChangeLogPage((p) =>
                                Math.min(totalPages, p + 1),
                              )
                            }
                            disabled={changeLogPage === totalPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Admin;
