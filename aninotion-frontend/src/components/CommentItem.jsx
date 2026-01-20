import React, { useState } from 'react';
import { Edit2, Trash2, CornerDownRight, X, Check, Clock, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { commentsAPI } from '../services/api';

/**
 * CommentItem - A reusable component for displaying a single comment
 * 
 * @param {Object} comment - The comment object
 * @param {Object} currentUser - The current logged-in user
 * @param {Function} onEdit - Callback when comment is edited
 * @param {Function} onDelete - Callback when comment is deleted
 * @param {Function} onReply - Callback when reply button is clicked
 * @param {boolean} isReply - Whether this comment is a reply
 * @param {number} replyCount - Number of replies to this comment
 */
const CommentItem = ({ 
  comment, 
  currentUser, 
  onEdit, 
  onDelete, 
  onReply,
  isReply = false,
  replyCount = 0
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Replies state
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [localReplyCount, setLocalReplyCount] = useState(replyCount);

  // Check if current user can edit/delete this comment
  const isOwner = currentUser && comment.author?._id === currentUser._id;
  const isAdmin = currentUser?.role === 'admin';
  const canModify = isOwner || isAdmin;

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    
    setIsSaving(true);
    try {
      await onEdit(comment._id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save edit:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    setIsDeleting(true);
    try {
      await onDelete(comment._id);
    } catch (error) {
      console.error('Failed to delete:', error);
      setIsDeleting(false);
    }
  };

  // Load replies for this comment
  const loadReplies = async () => {
    if (repliesLoaded) {
      setShowReplies(!showReplies);
      return;
    }
    
    setIsLoadingReplies(true);
    try {
      const response = await commentsAPI.getReplies(comment._id);
      setReplies(response.replies || []);
      setRepliesLoaded(true);
      setShowReplies(true);
    } catch (error) {
      console.error('Failed to load replies:', error);
    } finally {
      setIsLoadingReplies(false);
    }
  };

  // Handle edit of a reply
  const handleEditReply = async (replyId, newContent) => {
    await onEdit(replyId, newContent);
    setReplies(prev => prev.map(r => 
      r._id === replyId 
        ? { ...r, content: newContent, isEdited: true, editedAt: new Date().toISOString() }
        : r
    ));
  };

  // Handle delete of a reply
  const handleDeleteReply = async (replyId) => {
    await onDelete(replyId);
    setReplies(prev => prev.filter(r => r._id !== replyId));
    setLocalReplyCount(prev => Math.max(0, prev - 1));
  };

  // Add a new reply to the list (called from parent)
  const addReply = (newReply) => {
    setReplies(prev => [...prev, newReply]);
    setLocalReplyCount(prev => prev + 1);
    if (!showReplies) {
      setShowReplies(true);
      setRepliesLoaded(true);
    }
  };

  // Expose addReply method through comment object
  comment._addReply = addReply;

  return (
    <div className={`${isReply ? 'ml-8 sm:ml-12' : ''} ${isDeleting ? 'opacity-50' : ''}`}>
      <div className="flex space-x-3 sm:space-x-4">
        {/* Reply indicator */}
        {isReply && (
          <div className="flex-shrink-0 w-6 flex items-start justify-center pt-2">
            <CornerDownRight size={16} className="text-gray-400" />
          </div>
        )}
        
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.author?.profilePicture ? (
            <img
              src={comment.author.profilePicture}
              alt={comment.author.name || 'User'}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
              {(comment.author?.name || comment.author?.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <span className="font-semibold text-gray-900 text-sm sm:text-base">
              {comment.author?.name || comment.author?.email || 'Anonymous'}
            </span>
            <span className="text-gray-500 text-xs sm:text-sm flex items-center">
              <Clock size={12} className="mr-1" />
              {formatDate(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="text-gray-400 text-xs italic">(edited)</span>
            )}
          </div>

          {/* Content or Edit Form */}
          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm sm:text-base"
                rows={3}
                placeholder="Edit your comment..."
                autoFocus
              />
              <div className="flex items-center space-x-2 mt-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editContent.trim()}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Check size={14} />
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                  <X size={14} />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-700 text-sm sm:text-base whitespace-pre-wrap break-words">
                {comment.content}
              </p>

              {/* Images */}
              {comment.images && comment.images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {comment.images.map((image, index) => (
                    <a
                      key={index}
                      href={image.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={image.url}
                        alt={image.altText || `Comment image ${index + 1}`}
                        className="max-w-xs max-h-48 rounded-lg object-cover hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-4 mt-2">
                {onReply && !isReply && (
                  <button
                    onClick={() => onReply(comment)}
                    className="text-gray-500 hover:text-blue-600 text-xs sm:text-sm font-medium transition-colors"
                  >
                    Reply
                  </button>
                )}

                {/* View Replies Button - only for top-level comments with replies */}
                {!isReply && localReplyCount > 0 && (
                  <button
                    onClick={loadReplies}
                    disabled={isLoadingReplies}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isLoadingReplies ? (
                      <span>Loading...</span>
                    ) : (
                      <>
                        <MessageCircle size={14} />
                        <span>
                          {showReplies ? 'Hide' : 'View'} {localReplyCount} {localReplyCount === 1 ? 'reply' : 'replies'}
                        </span>
                        {showReplies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </>
                    )}
                  </button>
                )}
                
                {canModify && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 text-xs sm:text-sm transition-colors"
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center space-x-1 text-gray-500 hover:text-red-600 text-xs sm:text-sm transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={12} />
                      <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  </>
                )}
              </div>

              {/* Replies Section */}
              {!isReply && showReplies && replies.length > 0 && (
                <div className="mt-4 space-y-4 border-l-2 border-gray-200 pl-4">
                  {replies.map((reply) => (
                    <CommentItem
                      key={reply._id}
                      comment={reply}
                      currentUser={currentUser}
                      onEdit={handleEditReply}
                      onDelete={handleDeleteReply}
                      onReply={null}
                      isReply={true}
                      replyCount={0}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
