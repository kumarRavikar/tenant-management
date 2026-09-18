import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Paperclip,
  MessageSquare,
  History,
  Send,
  Upload,
  File,
  Music,
  Image as ImageIcon,
  UserPlus,
} from 'lucide-react';
import {
  useMaintenanceTicket,
  useUpdateTicket,
  useAssignTicket,
  useAddComment,
  useUploadAttachment,
  useTicketActivity,
} from '@/features/maintenance/maintenance.hooks';
import { useCurrentUser } from '@/features/auth/auth.hooks';
import {
  MaintenancePriority,
  MaintenanceStatus,
} from '@/features/maintenance/maintenance.types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export const MaintenanceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();

  const { data: ticket, isLoading, refetch } = useMaintenanceTicket(id);
  const { data: activities = [], refetch: refetchActivity } = useTicketActivity(id);

  const updateTicketMutation = useUpdateTicket();
  const assignTicketMutation = useAssignTicket();
  const addCommentMutation = useAddComment();
  const uploadAttachmentMutation = useUploadAttachment();

  // Comment Form State
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Assign Modal State
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assigneeId, setAssigneeId] = useState('');
  const [assignError, setAssignError] = useState<string | null>(null);

  // Status Change State
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<MaintenanceStatus>('OPEN');
  const [statusError, setStatusError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-slate-500">
        Loading maintenance ticket details...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Ticket not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/maintenance')}>
          Back to Tickets
        </Button>
      </div>
    );
  }

  const canManage =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'PROPERTY_ADMIN' ||
    user?.role === 'MANAGER' ||
    ticket.assignedToId === user?.id;

  const canAssign =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'PROPERTY_ADMIN' ||
    user?.role === 'MANAGER';

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentError(null);

    try {
      await addCommentMutation.mutateAsync({ id: ticket.id, comment: commentText.trim() });
      setCommentText('');
      refetch();
      refetchActivity();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setCommentError(error.response?.data?.message || 'Failed to post comment');
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploadError(null);

    try {
      await uploadAttachmentMutation.mutateAsync({ id: ticket.id, file: selectedFile });
      setSelectedFile(null);
      refetch();
      refetchActivity();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setUploadError(error.response?.data?.message || 'Failed to upload attachment');
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError(null);

    try {
      await assignTicketMutation.mutateAsync({ id: ticket.id, data: { assignedToId: assigneeId } });
      setIsAssignOpen(false);
      refetch();
      refetchActivity();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setAssignError(error.response?.data?.message || 'Failed to assign staff member');
    }
  };

  const handleStatusChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusError(null);

    try {
      await updateTicketMutation.mutateAsync({ id: ticket.id, data: { status: newStatus } });
      setIsStatusOpen(false);
      refetch();
      refetchActivity();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setStatusError(error.response?.data?.message || 'Failed to update ticket status');
    }
  };

  const getPriorityBadge = (priority: MaintenancePriority) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <Flame className="w-3.5 h-3.5 text-rose-600" /> URGENT
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            LOW
          </span>
        );
    }
  };

  const getStatusBadge = (status: MaintenanceStatus) => {
    switch (status) {
      case 'OPEN':
        return (
          <Badge variant="danger" className="gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Open
          </Badge>
        );
      case 'ASSIGNED':
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="w-3.5 h-3.5" /> Assigned
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="info" className="gap-1">
            <Wrench className="w-3.5 h-3.5" /> In Progress
          </Badge>
        );
      case 'RESOLVED':
      case 'CLOSED':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> {status}
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" className="gap-1">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Top */}
      <div className="flex items-center justify-between">
        <Link
          to="/maintenance"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tickets
        </Link>

        {/* Status Actions */}
        <div className="flex items-center gap-2">
          {canAssign && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAssignError(null);
                setAssigneeId(ticket.assignedToId || '');
                setIsAssignOpen(true);
              }}
              className="flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              Assign Staff
            </Button>
          )}

          {canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setStatusError(null);
                setNewStatus(ticket.status);
                setIsStatusOpen(true);
              }}
              className="flex items-center gap-1.5"
            >
              <Wrench className="w-4 h-4" />
              Update Status
            </Button>
          )}
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900">{ticket.title}</h1>
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ticket ID: {ticket.id} | Created on {new Date(ticket.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Description, Attachments, Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Issue Description
            </h2>
            <p className="text-slate-800 whitespace-pre-line leading-relaxed text-sm">
              {ticket.description}
            </p>
          </div>

          {/* Attachments Section */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Paperclip className="w-5 h-5 text-indigo-600" />
              Attachments ({ticket.attachments?.length || 0})
            </h2>

            {/* Upload form */}
            <form onSubmit={handleFileUpload} className="flex flex-col sm:flex-row gap-3 items-center">
              <input
                type="file"
                accept="image/*,audio/*,.pdf,.doc,.docx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={!selectedFile || uploadAttachmentMutation.isPending}
                className="flex items-center gap-1.5 shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                {uploadAttachmentMutation.isPending ? 'Uploading...' : 'Upload File'}
              </Button>
            </form>
            {uploadError && <p className="text-xs text-rose-600">{uploadError}</p>}

            {/* List of Attachments */}
            {ticket.attachments && ticket.attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {ticket.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {att.attachmentType === 'PHOTO' ? (
                        <ImageIcon className="w-4 h-4 text-indigo-600" />
                      ) : att.attachmentType === 'AUDIO' ? (
                        <Music className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <File className="w-4 h-4 text-indigo-600" />
                      )}
                      <span className="font-semibold text-slate-800 truncate" title={att.fileName}>
                        {att.fileName}
                      </span>
                    </div>

                    {/* Preview according to type */}
                    {att.attachmentType === 'PHOTO' && (
                      <img
                        src={att.fileUrl}
                        alt={att.fileName}
                        className="w-full h-32 object-cover rounded-md border border-slate-200"
                        onError={(e) => {
                          // fallback if static server isn't serving directly
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}

                    {att.attachmentType === 'AUDIO' && (
                      <audio controls className="w-full h-8 mt-1">
                        <source src={att.fileUrl} type={att.fileType} />
                        Your browser does not support audio playback.
                      </audio>
                    )}

                    <div className="flex justify-between items-center text-slate-400 pt-1">
                      <span>{(att.fileSize / 1024).toFixed(1)} KB</span>
                      <a
                        href={att.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-2">No attachments uploaded yet.</p>
            )}
          </div>

          {/* Activity Audit Timeline */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <History className="w-5 h-5 text-indigo-600" />
              Activity Audit Trail
            </h2>

            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-400">No activity recorded yet.</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <div className="mt-1 h-2 w-2 rounded-full bg-indigo-600 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">
                          {act.user ? `${act.user.firstName} ${act.user.lastName}` : 'System'}
                        </span>
                        <span className="text-slate-400">
                          {new Date(act.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{act.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Context info & Discussion thread */}
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-sm">
            <h2 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Ticket Info</h2>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase">Unit Location</span>
              <p className="font-medium text-slate-900 mt-0.5">
                Unit {ticket.unit?.unitNumber || '—'}
              </p>
              <p className="text-xs text-slate-500">
                {ticket.unit?.floor?.building?.name && `${ticket.unit.floor.building.name} - `}
                {ticket.unit?.floor?.building?.property?.name}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase">Reported By</span>
              <p className="font-medium text-slate-900 mt-0.5">
                {ticket.createdBy?.firstName} {ticket.createdBy?.lastName}
              </p>
              <p className="text-xs text-slate-500">{ticket.createdBy?.email}</p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase">Assigned Staff</span>
              {ticket.assignedTo ? (
                <div>
                  <p className="font-medium text-slate-900 mt-0.5">
                    {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{ticket.assignedTo.email}</p>
                </div>
              ) : (
                <p className="text-slate-400 italic mt-0.5">Unassigned</p>
              )}
            </div>
          </div>

          {/* Comments Thread Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              Discussion ({ticket.comments?.length || 0})
            </h2>

            {/* List */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {ticket.comments && ticket.comments.length > 0 ? (
                ticket.comments.map((comm) => (
                  <div key={comm.id} className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-900">
                        {comm.user?.firstName} {comm.user?.lastName}
                        {comm.user?.role && (
                          <span className="ml-1 text-[10px] text-indigo-600 font-normal">
                            ({comm.user.role})
                          </span>
                        )}
                      </span>
                      <span className="text-slate-400">
                        {new Date(comm.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap">{comm.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-2">No comments yet.</p>
              )}
            </div>

            {/* Add comment */}
            <form onSubmit={handleCommentSubmit} className="space-y-2 pt-2 border-t border-slate-100">
              <textarea
                required
                rows={2}
                placeholder="Write a comment or update..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {commentError && <p className="text-xs text-rose-600">{commentError}</p>}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={addCommentMutation.isPending || !commentText.trim()}
                  className="flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Assign Staff Member"
        description="Select a user or staff member to assign to this maintenance request"
        maxWidth="sm"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          {assignError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {assignError}
            </div>
          )}

          <Input
            label="User ID to Assign"
            required
            placeholder="00000000-0000-0000-0000-000000000000"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAssignOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={assignTicketMutation.isPending}>
              {assignTicketMutation.isPending ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Status Modal */}
      <Modal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        title="Update Ticket Status"
        description="Advance the ticket lifecycle status"
        maxWidth="sm"
      >
        <form onSubmit={handleStatusChangeSubmit} className="space-y-4">
          {statusError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {statusError}
            </div>
          )}

          <Select
            label="Select Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as MaintenanceStatus)}
            options={[
              { label: 'Open', value: 'OPEN' },
              { label: 'Assigned', value: 'ASSIGNED' },
              { label: 'In Progress', value: 'IN_PROGRESS' },
              { label: 'On Hold', value: 'ON_HOLD' },
              { label: 'Resolved', value: 'RESOLVED' },
              { label: 'Closed', value: 'CLOSED' },
              { label: 'Cancelled', value: 'CANCELLED' },
            ]}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsStatusOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={updateTicketMutation.isPending}>
              {updateTicketMutation.isPending ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
