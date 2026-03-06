import React from 'react';

const getPageProfileImage = (page) => page?.profileImageUrl || page?.profileimageurl || page?.avatarUrl || '';

const PageCard = ({
  page,
  mode = 'explore',
  onOpen,
  onFollowToggle,
  isFollowing = false,
  isOwned = false,
  followLoading = false,
  onManage,
  showManage = false
}) => {
  const profileImageUrl = getPageProfileImage(page);
  const bannerImageUrl = page?.bannerImageUrl || page?.bannerimageurl || '';

  const exploreMode = mode === 'explore';

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: 'pointer'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }}
    >
      <div
        style={{
          height: '150px',
          background: bannerImageUrl
            ? `url(${bannerImageUrl})`
            : (exploreMode
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)'),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative'
        }}
        onClick={onOpen}
      >
        {exploreMode && bannerImageUrl && (
          <img
            src={bannerImageUrl}
            alt={page.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        <div
          style={{
            position: 'absolute',
            bottom: '-30px',
            left: exploreMode ? '50%' : '16px',
            transform: exploreMode ? 'translateX(-50%)' : 'none',
            width: exploreMode ? '60px' : '80px',
            height: exploreMode ? '60px' : '80px',
            borderRadius: '50%',
            border: '4px solid white',
            background: profileImageUrl ? `url(${profileImageUrl})` : '#e2e8f0',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: exploreMode ? '24px' : '36px',
            color: '#94a3b8',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            zIndex: 1
          }}
        >
          {!profileImageUrl && page.name?.[0]}
        </div>
      </div>

      <div style={{ padding: exploreMode ? '42px 16px 16px' : '50px 16px 16px' }}>
        <h3
          style={{
            color: '#1e293b',
            margin: '0 0 4px 0',
            fontSize: '16px',
            fontWeight: '700',
            textAlign: exploreMode ? 'center' : 'left'
          }}
          onClick={onOpen}
        >
          {page.name}
        </h3>

        <p style={{
          color: exploreMode ? '#6366f1' : '#64748b',
          fontSize: '12px',
          margin: '0 0 12px 0',
          textAlign: exploreMode ? 'center' : 'left',
          textTransform: exploreMode ? 'uppercase' : 'none',
          fontWeight: exploreMode ? '500' : '400'
        }}>
          {page.category}
        </p>

        {exploreMode ? (
          <>
            <p style={{
              fontSize: '13px',
              color: '#64748b',
              lineHeight: '1.5',
              margin: '0 0 12px 0',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {page.description}
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginTop: 'auto',
              paddingTop: '12px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {page._count?.followers || 0} followers
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isOwned) onFollowToggle?.(page.id);
                }}
                disabled={followLoading || isOwned}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: (followLoading || isOwned) ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: isOwned ? '#e2e8f0' : (isFollowing ? '#dbeafe' : '#0284c7'),
                  color: isOwned ? '#64748b' : (isFollowing ? '#1d4ed8' : '#fff')
                }}
              >
                {isOwned
                  ? 'Owned'
                  : (followLoading
                    ? (isFollowing ? 'Unfollowing...' : 'Following...')
                    : (isFollowing ? 'Following' : 'Follow'))}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#0284c7', fontSize: '18px', fontWeight: '700', margin: 0 }}>
                  {page._count?.followers || 0}
                </p>
                <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0 0' }}>Followers</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#0284c7', fontSize: '18px', fontWeight: '700', margin: 0 }}>
                  {page._count?.posts || 0}
                </p>
                <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0 0' }}>Posts</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: showManage ? '1fr 1fr' : '1fr', gap: '8px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen?.();
                }}
                style={{
                  padding: '8px 12px',
                  background: '#f1f5f9',
                  color: '#0284c7',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                View
              </button>
              {showManage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onManage?.();
                  }}
                  style={{
                    padding: '8px 12px',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  Manage
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PageCard;
