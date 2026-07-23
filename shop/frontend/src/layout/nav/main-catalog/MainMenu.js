import React, { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames';
import { MENU_PLACEMENT, MENU_BEHAVIOUR, ALLOWED_ACCOUNTING_SHOP_TYPES, isAccountingShopType } from 'constants.js';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { getMenuItems } from 'routing/helper';
import { useWindowSize } from 'hooks/useWindowSize';
import { useWindowScroll } from 'hooks/useWindowScroll';
import allRoutes from 'routes.js';
import { AuthContext } from 'contexts/AuthContext';
import { layoutShowingNavMenu } from 'layout/layoutSlice';
import MainMenuItems from './MainMenuItems';
import {
  menuChangeAttrMenuAnimate,
  menuChangeAttrMobile,
  menuChangeBehaviourStatus,
  menuChangeCollapseAll,
  menuChangeNavClasses,
  menuChangePinButtonEnable,
  menuChangePlacementStatus,
} from './catalogSlice';
import { checkBehaviour, checkPlacement, isDeeplyDiffBehaviourStatus, isDeeplyDiffPlacementStatus } from './helper';

const MainMenu = () => {
  const dispatch = useDispatch();
  const { placement, behaviour, placementStatus, behaviourStatus, attrMobile, breakpoints, useSidebar } = useSelector((state) => state.catalog);
  const { isLogin, currentUser: reduxUser } = useSelector((state) => state.auth);
  const scrolled = useWindowScroll();
  const { width } = useWindowSize();

  const { activePlans, currentUser: contextUser } = React.useContext(AuthContext);
  const currentUser = contextUser || reduxUser;

  const filteredRoutes = useMemo(() => {
    let routesToFilter = attrMobile && useSidebar ? allRoutes : allRoutes.mainMenuItems;
    
    if (activePlans && !activePlans.includes('KOT Panel')) {
      if (Array.isArray(routesToFilter)) {
        routesToFilter = routesToFilter.filter(route => route.label !== 'KOT');
      } else if (routesToFilter.mainMenuItems) {
        routesToFilter = {
          ...routesToFilter,
          mainMenuItems: routesToFilter.mainMenuItems.filter(route => route.label !== 'KOT')
        };
      }
    }

    // Filter Accounting feature based on shop type
    const shopType = currentUser?.shop_type;
    const canSeeAccounting = isAccountingShopType(shopType);

    if (!canSeeAccounting) {
      if (Array.isArray(routesToFilter)) {
        routesToFilter = routesToFilter.filter(route => route.label !== 'Accounting');
      } else if (routesToFilter.mainMenuItems) {
        routesToFilter = {
          ...routesToFilter,
          mainMenuItems: routesToFilter.mainMenuItems.filter(route => route.label !== 'Accounting')
        };
      }
    }

    return routesToFilter;
  }, [attrMobile, useSidebar, activePlans, currentUser]);

  const catalogItemsMemo = useMemo(
    () =>
      getMenuItems({
        data: filteredRoutes,
        isLogin,
        userRole: currentUser.role,
      }),
    [isLogin, currentUser, filteredRoutes]
  );

  useEffect(() => {
    dispatch(menuChangeAttrMenuAnimate(''));
    dispatch(layoutShowingNavMenu(''));

    if (placementStatus.status === 2 || placementStatus.status === 4) {
      // Switching back from the mobile catalog layout fast
      dispatch(menuChangeNavClasses({}));
      dispatch(menuChangeAttrMobile(false));
    }
    // Prevents catalog animation to make a fast switch
    if (behaviourStatus.status === 1) {
      dispatch(menuChangeCollapseAll(true));
      dispatch(menuChangePinButtonEnable(true));
    } else if (behaviourStatus.status === 2) {
      dispatch(menuChangeCollapseAll(true));
      dispatch(menuChangePinButtonEnable(false));
    } else if (behaviourStatus.status === 3) {
      dispatch(menuChangePinButtonEnable(true));
      dispatch(menuChangeCollapseAll(false));
    } else if (behaviourStatus.status === 4) {
      dispatch(menuChangePinButtonEnable(false));
      dispatch(menuChangeCollapseAll(true));
    } else if (behaviourStatus.status === 5) {
      dispatch(menuChangeCollapseAll(false));
      dispatch(menuChangePinButtonEnable(true));
    } else if (behaviourStatus.status === 6) {
      dispatch(menuChangeCollapseAll(false));
      dispatch(menuChangePinButtonEnable(true));
    }
    // eslint-disable-next-line
  }, [behaviourStatus, placementStatus]);

  useEffect(() => {
    if (placementStatus.placementHtmlData === MENU_PLACEMENT.Vertical && behaviourStatus.behaviourHtmlData === MENU_BEHAVIOUR.Unpinned && attrMobile !== true) {
      dispatch(menuChangeCollapseAll(true));
      dispatch(menuChangeAttrMenuAnimate('hidden'));
    }
    return () => {};
    // eslint-disable-next-line
  }, [attrMobile]);

  useEffect(() => {
    if (placementStatus.placementHtmlData === MENU_PLACEMENT.Horizontal && !attrMobile && behaviourStatus.behaviourHtmlData === MENU_BEHAVIOUR.Unpinned) {
      if (scrolled) {
        dispatch(menuChangeAttrMenuAnimate('hidden'));
        // Hiding all dropdowns to make sure they are closed when catalog collapses
        document.documentElement.click();
      } else {
        dispatch(menuChangeAttrMenuAnimate(''));
      }
    }
    return () => {};
    // eslint-disable-next-line
  }, [scrolled]);

  const getMenuStatus = useCallback(
    (pBreakpoints, pPlacement, pBehaviour) => {
      if (pBreakpoints) {
        const placementStatusCB = checkPlacement({ placement: pPlacement, breakpoints: pBreakpoints });
        const behaviourStatusCB = checkBehaviour({ placement: placementStatusCB.placementHtmlData, behaviour: pBehaviour, breakpoints: pBreakpoints });

        if (isDeeplyDiffPlacementStatus(placementStatusCB, placementStatus)) {
          dispatch(menuChangePlacementStatus(placementStatusCB));
        }
        if (isDeeplyDiffBehaviourStatus(behaviourStatusCB, behaviourStatus)) {
          dispatch(menuChangeBehaviourStatus(behaviourStatusCB));
        }
      }
      // eslint-disable-next-line
  }, [behaviourStatus,placementStatus,breakpoints]);

  useEffect(() => {
    if (width && placement && behaviour && breakpoints) {
      getMenuStatus(breakpoints, placement, behaviour);
    }
    // eslint-disable-next-line
  }, [width, breakpoints, placement, behaviour]);

  // Initializes the horizontal catalog
  // Customizes dropdown clicks to prevent auto closing and making sure all sub menus are closed when parent is closed
  if (catalogItemsMemo) {
    if (placementStatus.view === MENU_PLACEMENT.Horizontal) {
      return (
        <div className="menu-container flex-grow-1">
          <ul id="menu" className={classNames('menu show')}>
            <MainMenuItems catalogItems={catalogItemsMemo} menuPlacement={placementStatus.view} />
          </ul>
        </div>
      );
    }
    // Vertical catalog scrollbar init
    return (
      <OverlayScrollbarsComponent
        options={{
          scrollbars: { autoHide: 'leave', autoHideDelay: 600 },
          overflowBehavior: { x: 'hidden', y: 'scroll' },
        }}
        className="menu-container flex-grow-1"
      >
        <ul id="menu" className={classNames('menu show')}>
          <MainMenuItems catalogItems={catalogItemsMemo} menuPlacement={placementStatus.view} />
        </ul>
      </OverlayScrollbarsComponent>
    );
  }
  return <></>;
};

export default React.memo(MainMenu);
