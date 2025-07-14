// SharedInfoComponents.jsx - ONE place for InfoField and InfoCard
import React from 'react';
import fieldStyles from './desktopCardStyles/fieldStyles';
import infoCardStyles from './desktopCardStyles/infoCardStyles';
import animationStyles from './desktopCardStyles/animationStyles';

// ONE InfoField component used by ALL sections
export const InfoField = ({ label, value, fieldIndex = 0 }) => {
  const isEmpty = !value || value === '—';
  const labelStyles = fieldStyles.getStyles.label();
  const valueStyles = fieldStyles.getStyles.value(isEmpty);
  
  // Add animation classes
  const animationClass = animationStyles.helpers.getFieldAnimationClasses(fieldIndex);
  
  return (
    <div className={`${fieldStyles.getStyles.wrapper()} ${animationClass}`}>
      <p 
        className={labelStyles.className} 
        style={labelStyles.style}
      >
        {label}
      </p>
      <p 
        className={valueStyles.className}
        style={valueStyles.style}
      >
        {value || '—'}
      </p>
    </div>
  );
};

// ONE InfoCard component used by ALL sections
export const InfoCard = ({ title, icon, children, sectionKey, hoveredSection, onMouseEnter, onMouseLeave, onClick, cardIndex = 0, isVisible = false }) => {
  const isHovered = hoveredSection === sectionKey;
  
  // Get animation classes
  const animationClass = animationStyles.helpers.getCardAnimationClasses(cardIndex, isVisible);
  
  // Add field indices to children
  const childrenWithIndices = React.Children.map(children, (child, index) => {
    if (React.isValidElement(child) && child.type === InfoField) {
      return React.cloneElement(child, { fieldIndex: index });
    }
    return child;
  });
  
  return (
    <div 
      className={`${infoCardStyles.getCardClasses(isHovered, sectionKey)} ${animationClass}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={infoCardStyles.getBoxShadow(isHovered)}
    >
      <div className={infoCardStyles.header.wrapper}>
        <div 
          className={`${infoCardStyles.header.iconBox} ${animationStyles.classes.smoothTransition}`}
          style={isHovered ? infoCardStyles.header.iconBoxGradient.hover : infoCardStyles.header.iconBoxGradient.default}
        >
          {React.cloneElement(icon, {
            className: `${icon.props.className || ''} ${infoCardStyles.header.icon} ${isHovered ? infoCardStyles.header.iconColor.hover : infoCardStyles.header.iconColor.default} ${animationStyles.classes.smoothTransition}`
          })}
        </div>
        <span 
          className={infoCardStyles.header.title} 
          style={infoCardStyles.header.titleStyle}
        >
          {title}
        </span>
      </div>
      <div className={infoCardStyles.content.wrapper}>
        {childrenWithIndices}
      </div>
      {isHovered && (
        <>
          <div className={infoCardStyles.hoverIndicators.topRight.wrapper}>
            <svg className={infoCardStyles.hoverIndicators.topRight.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className={infoCardStyles.hoverIndicators.bottomRight.wrapper}>
            <span className={infoCardStyles.hoverIndicators.bottomRight.text}>Edit</span>
          </div>
        </>
      )}
    </div>
  );
};

export default { InfoField, InfoCard };