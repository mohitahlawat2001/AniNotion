import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Send, X, ChevronDown, AlertCircle, LogIn } from 'lucide-react';
import { commentsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import CommentItem from './CommentItem';
import LoadingSpinner from './LoadingSpinner';
import LoginModal from './LoginModal';

/**
 * CommentSection - A reusable component for displaying and managing comments
 * 
 * @param {string} postId - The ID of the post to show comments for (required)
 * @param {string} className - Additional CSS classes
 * @param {number} initialLimit - Number of comments to load initially (default: 10)
 * @param {boolean} showTitle - Whether to show the section title (default: true)
 * @param {string} sortOrder - Sort order: 'desc' (newest first) or 'asc' (oldest first)
 */
const CommentSection = ({ 
  postId, 
  className = '', 
  initialLimit = 10,
  showTitle = true,
  sortOrder = 'desc'
}) => {
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasMore: false
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch comments
  const fetchComments = useCallback(async (page = 1, append = false) => {
    if (!postId) return;

    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      const response = await commentsAPI.getByPost(postId, {
        page,
        limit: initialLimit,
        sortOrder
      });

      if (append) {
        setComments(prev => [...prev, ...response.comments]);
      } else {
        setComments(response.comments);
      }
      
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [postId, initialLimit, sortOrder]);

  // Initial load
  useEffect(() => {
    fetchComments(1, false);
  }, [fetchComments]);

  // Handle new comment submission
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError('Please log in to comment');
      return;
    }

    const content = newComment.trim();
    if (!content) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await commentsAPI.create(postId, content);
      
      // Add new comment to the list (at the beginning if newest first)
      if (sortOrder === 'desc') {
        setComments(prev => [response.comment, ...prev]);
      } else {
        setComments(prev => [...prev, response.comment]);
      }
      
      setPagination(prev => ({
        ...prev,
        totalCount: prev.totalCount + 1
      }));
      
      setNewComment('');
    } catch (err) {
      console.error('Error creating comment:', err);
      setError(err.message || 'Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reply submission
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated || !replyingTo) return;

    const content = replyContent.trim();
    if (!content) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await commentsAPI.create(postId, content, replyingTo._id);
      
      // Update the parent comment's reply count
      setComments(prev => prev.map(c => 
        c._id === replyingTo._id 
          ? { ...c, replyCount: (c.replyCount || 0) + 1 }
          : c
      ));
      
      // Trigger the parent comment to show the new reply
      if (replyingTo._addReply) {
        replyingTo._addReply(response.comment);
      }
      
      setReplyingTo(null);
      setReplyContent('');
    } catch (err) {
      console.error('Error creating reply:', err);
      setError(err.message || 'Failed to post reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle comment edit
  const handleEditComment = async (commentId, newContent) => {
    try {
      await commentsAPI.update(commentId, newContent);
      
      // Update comment in state
      setComments(prev => prev.map(c => 
        c._id === commentId 
          ? { ...c, content: newContent, isEdited: true, editedAt: new Date().toISOString() }
          : c
      ));
    } catch (err) {
      console.error('Error editing comment:', err);
      throw err;
    }
  };

  // Handle comment delete
  const handleDeleteComment = async (commentId) => {
    try {
      await commentsAPI.delete(commentId);
      
      // Remove comment from state
      setComments(prev => prev.filter(c => c._id !== commentId));
      setPagination(prev => ({
        ...prev,
        totalCount: Math.max(0, prev.totalCount - 1)
      }));
    } catch (err) {
      console.error('Error deleting comment:', err);
      throw err;
    }
  };

  // Handle reply click
  const handleReplyClick = (comment) => {
    if (!isAuthenticated) {
      setError('Please log in to reply');
      return;
    }
    setReplyingTo(comment);
    setReplyContent('');
  };

  // Cancel reply
  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  // Load more comments
  const handleLoadMore = () => {
    if (pagination.hasMore && !isLoadingMore) {
      fetchComments(pagination.currentPage + 1, true);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      {showTitle && (
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-2">
            <MessageCircle size={20} className="text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Comments {pagination.totalCount > 0 && `(${pagination.totalCount})`}
            </h3>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* New Comment Form */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
        {isAuthenticated ? (
          <form onSubmit={handleSubmitComment}>
            <div className="flex space-x-3">
              {/* User Avatar */}
              <div className="flex-shrink-0">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name || 'You'}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              {/* Input */}
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm sm:text-base"
                  rows={2}
                  disabled={isSubmitting}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                  >
                    <Send size={16} />
                    <span>{isSubmitting ? 'Posting...' : 'Post Comment'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center py-4 bg-gray-50 rounded-lg">
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center justify-center space-x-2 mx-auto px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <LogIn size={18} />
              <span>
                <span className="font-medium text-blue-600 hover:text-blue-700 hover:underline">Log in</span> to join the conversation
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => setShowLoginModal(false)}
      />

      {/* Reply Form */}
      {replyingTo && (
        <div className="px-4 sm:px-6 py-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-700">
              Replying to <strong>{replyingTo.author?.name || 'Anonymous'}</strong>
            </span>
            <button
              onClick={handleCancelReply}
              className="text-blue-600 hover:text-blue-800"
            >
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmitReply}>
            <div className="flex space-x-3">
              <div className="flex-1">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm sm:text-base"
                  rows={2}
                  autoFocus
                  disabled={isSubmitting}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !replyContent.trim()}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    <Send size={14} />
                    <span>{isSubmitting ? 'Posting...' : 'Post Reply'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Comments List */}
      <div className="px-4 sm:px-6 py-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="medium" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                currentUser={user}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                onReply={handleReplyClick}
                isReply={!!comment.parentComment}
                replyCount={comment.replyCount || 0}
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {pagination.hasMore && !isLoading && (
          <div className="mt-6 text-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {isLoadingMore ? (
                <>
                  <LoadingSpinner size="small" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <ChevronDown size={18} />
                  <span>Load More Comments</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
