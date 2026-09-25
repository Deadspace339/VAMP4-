import React from 'react';

const ProductCard = ({ product, onClick, onBuy }) => {
  if (!product) return null;

  const discountPercent = product.oldPrice && product.oldPrice > product.price
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;

  const uahPrice = Math.round(product.price * 67);

  return (
    <article 
      className="product-card" 
      onClick={() => onClick && onClick(product)}
      title="Нажмите, чтобы открыть страницу товара со всеми характеристиками"
    >
      <div className="product-card__image-box">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.title} 
            className="product-card__img" 
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80';
            }}
          />
        ) : (
          <div className="product-card__placeholder">💾</div>
        )}

        {/* Бейджи скидок и тегов */}
        <div className="product-card__badge-row">
          {discountPercent && (
            <span className="product-card__discount-pill">
              -{discountPercent}%
            </span>
          )}
          {product.tag && (
            <span className="product-card__tag-pill">
              {product.tag}
            </span>
          )}
        </div>

        {/* Быстрый бейдж доставки WB */}
        <span className="product-card__delivery-hint">
          ⚡ Завтра • WB Склад
        </span>

        {/* Аккуратный компактный бейдж рейтинга и оценок на картинке */}
        <div className="product-card__image-rating" title={`Рейтинг: ${product.rating || 5.0}, Оценок: ${product.reviewsCount || 1}`}>
          <span className="rating-star-icon">★</span>
          <span className="rating-val">{product.rating ? Number(product.rating).toFixed(1) : '5.0'}</span>
          <span className="rating-sep">•</span>
          <span className="rating-reviews-qty">{product.reviewsCount || 1}</span>
        </div>
      </div>

      <div className="product-card__content">
        {/* Цена со скидкой и старая цена */}
        <div className="product-card__price-row">
          <span className="product-card__current-price">
            {product.price.toLocaleString()} <span className="currency-label">$SWAG</span>
          </span>
          {product.oldPrice && (
            <span className="product-card__old-price">
              {product.oldPrice.toLocaleString()} $SWAG
            </span>
          )}
        </div>

        <div className="product-card__sub-price">
          ≈ {uahPrice.toLocaleString()} ₴ (1 SWAG = 67 ₴)
        </div>

        {/* Рейтинг и отзывы как на WB */}
        <div className="product-card__rating-row">
          <span className="rating-star">★ {product.rating || 5.0}</span>
          <span className="reviews-count">({product.reviewsCount || 1} отзывов)</span>
        </div>

        {/* Название и бренд */}
        <h3 className="product-card__title" title={product.title}>
          {product.title}
        </h3>

        <div className="product-card__seller-line">
          {product.seller || 'SWAG INC. OFFICIAL'}
        </div>

        {/* Подвал карточки с кнопкой покупки */}
        <div className="product-card__footer">
          <button 
            className="product-card__buy-btn cyber-btn"
            onClick={(e) => {
              e.stopPropagation();
              onBuy && onBuy(product);
            }}
            title="Быстрая покупка за $SWAG"
          >
            🛒 В КОРЗИНУ
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;