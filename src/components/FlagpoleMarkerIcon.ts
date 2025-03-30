import L from 'leaflet';

// Function to create a custom flagpole marker icon with header
export const createFlagpoleIcon = (replyCount: number, header: string = 'Message') => {
  const poleHeight = 40; // px
  const flagWidth = Math.max(60, header.length * 6 + 10); // Dynamically adjust flag width based on header length
  const flagHeight = 18; // px
  const circleDiameter = 12; // px

  // Calculate overall icon size and anchor points
  const iconWidth = flagWidth + 5; // Flag width + some padding from pole
  const iconHeight = poleHeight + circleDiameter / 2; // Pole height + half circle sticking out top
  const iconSize: [number, number] = [iconWidth, iconHeight];
  const iconAnchor: [number, number] = [5, iconHeight]; // Base of the pole (adjust x slightly for pole width)
  const popupAnchor: [number, number] = [flagWidth / 2, -iconHeight]; // Center popup above the flag

  // Determine reply circle color based on count
  const replyCircleColor = replyCount > 0 ? 'bg-orange-500' : 'bg-gray-400';
  const replyTextColor = replyCount > 0 ? 'text-white' : 'text-gray-700';
  const flagBgColor = 'bg-orange-500'; // Use orange for the flag background
  const flagTextColor = 'text-white';

  // Truncate long headers for the flag display
  const displayHeader = header.length > 15 ? header.substring(0, 12) + '...' : header;

  const html = `
    <div class="flagpole-marker-container" style="width: ${iconWidth}px; height: ${iconHeight}px; position: relative;">
      <!-- Pole -->
      <div class="flagpole-pole" style="position: absolute; bottom: 0; left: 5px; transform: translateX(-50%); width: 3px; height: ${poleHeight}px; background-color: #333;"></div>

      <!-- Flag Container -->
      <div class="flagpole-flag ${flagBgColor} ${flagTextColor}" style="position: absolute; top: 5px; left: 5px; /* Start flag next to pole */ width: ${flagWidth}px; height: ${flagHeight}px; display: flex; align-items: center; justify-content: center; padding: 0 5px; border-radius: 3px; box-shadow: 1px 1px 2px rgba(0,0,0,0.2);">
          <span class="flagpole-header-text" style="font-size: 10px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${displayHeader}
          </span>
      </div>

      <!-- Reply Count Circle -->
      <div class="flagpole-reply-circle ${replyCircleColor} ${replyTextColor}" style="position: absolute; top: -${circleDiameter / 2}px; left: 5px; transform: translateX(-50%); width: ${circleDiameter}px; height: ${circleDiameter}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold; border: 1px solid #555;">
        ${replyCount}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-div-icon flagpole-icon', // Add a general class
    html: html,
    iconSize: iconSize,
    iconAnchor: iconAnchor,
    popupAnchor: popupAnchor
  });
};
