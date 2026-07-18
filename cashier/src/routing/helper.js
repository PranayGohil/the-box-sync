import { IS_AUTH_GUARD_ACTIVE, DEFAULT_PATHS } from 'config.js';

const userHasRole = (routeRoles, userRole) => {
  if (!userRole) return false;
  return routeRoles.includes(userRole);
};

const clearRoute = (route) => {
  const item = {};
  ['path', 'to', 'exact', 'component', 'redirect'].forEach((key) => {
    if (route[key]) item[key] = route[key];
  });
  return item;
};
const clearMenuItem = (menuItem) => {
  const item = {};
  ['path', 'label', 'icon', 'isExternal', 'subs', 'mega', 'megaParent'].forEach((key) => {
    if (menuItem[key]) item[key] = menuItem[key];
  });
  return item;
};
const clearFlattedMenuItem = (menuItem) => {
  const item = {};
  ['path', 'label', 'isExternal'].forEach((key) => {
    if (menuItem[key]) item[key] = menuItem[key];
  });
  return item;
};

export const convertToRoutes = ({
  data = [],
  isLogin = false,
  userRole = null,
  authGuardActive = IS_AUTH_GUARD_ACTIVE,
  unauthorizedPath = DEFAULT_PATHS.UNAUTHORIZED,
  loginPath = DEFAULT_PATHS.LOGIN,
  invalidAccessPath = DEFAULT_PATHS.INVALID_ACCESS,
  noLayout = false,
}) => {
  let items = [];
  if (Array.isArray(data)) {
    items = data;
  } else {
    items = [...data.sidebarItems, ...data.mainMenuItems];
  }

  const routes = [];
  return () => {
    const itemMapper = (item) => {
      const tempItem = { ...item };
      if (item.hideInRoute) return itemMapper({});

      if (item.subs) tempItem.exact = true;

      /* Authentication Guard */
      if (authGuardActive) {
        if (tempItem.roles) tempItem.protected = true;
        if (tempItem.publicOnly) {
          delete tempItem.roles;
          delete tempItem.protected;
        }
        if (tempItem.protected) {
          if (!isLogin) {
            tempItem.redirect = true;
            tempItem.to = {
              pathname: loginPath,
              state: { from: tempItem.path },
            };
          } else if (tempItem.roles) {
            if (!userHasRole(tempItem.roles, userRole)) {
              tempItem.redirect = true;
              tempItem.to = {
                pathname: unauthorizedPath,
                state: { from: tempItem.path },
              };
            }
          }
        } else if (tempItem.publicOnly && isLogin) {
          tempItem.redirect = true;
          tempItem.to = {
            pathname: invalidAccessPath,
            state: { from: tempItem.path },
          };
        }
      }

      if (Object.keys(tempItem).length > 0 && !item.isExternal) {
        if (item.noLayout && noLayout) {
          routes.push(clearRoute({ ...tempItem, exact: true }));
        }
        if (!noLayout && item.noLayout !== true) {
          routes.push(clearRoute(tempItem));
        }
      }

      if (item.subs) {
        return item.subs.map((sub) => {
          const controlledSub = { ...sub, path: tempItem.path + sub.path };
          if (authGuardActive) {
            if (tempItem.protected) controlledSub.protected = true;
            if (tempItem.roles) {
              if (!sub.roles) controlledSub.roles = tempItem.roles;
              else {
                // common roles..
                controlledSub.roles = tempItem.roles.filter((x) => sub.roles.includes(x));

                if (controlledSub.roles && controlledSub.roles.length === 0) {
                  controlledSub.inaccessible = true;
                  console.log(
                    `This route(${controlledSub.path}) is inaccessible. Please check the roles you defined in the hierarchical structure.`,
                    controlledSub
                  );
                }
              }
            } else if (tempItem.publicOnly) {
              controlledSub.publicOnly = true;
            }
            if (controlledSub.roles && controlledSub.roles.length === 0) delete controlledSub.roles;

            if (!controlledSub.inaccessible) return itemMapper(controlledSub);
            return itemMapper({});
          }
          return itemMapper(controlledSub);
        });
      }
      return tempItem;
    };
    items.map(itemMapper);
    return routes;
  };
};

export const convertToMenuItems = ({ data = [], authGuardActive = IS_AUTH_GUARD_ACTIVE, isLogin = false, userRole = null }) => {
  let items = [];
  if (Array.isArray(data)) {
    items = data;
  } else {
    items = [...data.sidebarItems, ...data.mainMenuItems];
  }

  const itemMapper = (item) => {
    const tempItem = { ...item };

    if (authGuardActive) {
      /* Authentication Guard */
      if (tempItem.roles) tempItem.protected = true;

      if (tempItem.publicOnly) {
        delete tempItem.roles;
        delete tempItem.protected;
      }

      if (tempItem.protected) {
        if (!isLogin) {
          return {};
        }
        if (tempItem.roles) {
          if (!userHasRole(tempItem.roles, userRole)) {
            return {};
          }
        }
      } else if (tempItem.publicOnly && isLogin) {
        return {};
      }
    }

    if (tempItem.subs) {
      tempItem.subs = item.subs
        .map((sub) => {
          const controlledSub = { ...sub, path: tempItem.path + sub.path };
          if (tempItem.mega || tempItem.megaParent) controlledSub.megaParent = true;

          if (authGuardActive) {
            if (tempItem.protected) controlledSub.protected = true;

            if (tempItem.roles) {
              if (!sub.roles) controlledSub.roles = tempItem.roles;
              else {
                // common roles..
                controlledSub.roles = tempItem.roles.filter((x) => sub.roles.includes(x));

                if (controlledSub.roles && controlledSub.roles.length === 0) {
                  controlledSub.inaccessible = true;
                  console.log(
                    `This menu item(${controlledSub.path}) is inaccessible. Please check the roles you defined in the hierarchical structure.`,
                    controlledSub
                  );
                }
              }
            } else if (tempItem.publicOnly) {
              controlledSub.publicOnly = true;
            }
            if (controlledSub.roles && controlledSub.roles.length === 0) delete controlledSub.roles;

            if (!controlledSub.inaccessible) return itemMapper(controlledSub);
            return itemMapper({});
          }
          return itemMapper(controlledSub);
        })
        .filter((x) => Object.keys(x).length > 0);

      if (tempItem.subs.length === 0) delete tempItem.subs;
    }
    if (tempItem.label && !item.hideInMenu) return clearMenuItem(tempItem);
    return {};
  };
  return items.map(itemMapper).filter((x) => Object.keys(x).length > 0);
};

export const convertToSearchItems = ({ data = [], authGuardActive = IS_AUTH_GUARD_ACTIVE, isLogin = false, userRole = null }) => {
  let items = [];
  if (Array.isArray(data)) {
    items = data;
  } else {
    items = [...data.sidebarItems, ...data.mainMenuItems];
  }

  const menuItems = [];

  return () => {
    const itemMapper = (item) => {
      let tempItem = { ...item };
      if (tempItem.hideInMenu || tempItem.isExternal || tempItem.hideInRoute) {
        return {};
      }
      if (authGuardActive) {
        /* Authentication Guard */
        if (tempItem.roles) tempItem.protected = true;

        if (tempItem.publicOnly) {
          delete tempItem.roles;
          delete tempItem.protected;
        }

        if (tempItem.protected) {
          if (!isLogin) {
            tempItem = {};
          } else if (tempItem.roles) {
            if (!userHasRole(tempItem.roles, userRole)) {
              tempItem = {};
            }
          }
        } else if (tempItem.publicOnly && isLogin) {
          tempItem = {};
        }
      }

      if (Object.keys(tempItem).length > 0 && tempItem.label) menuItems.push(clearFlattedMenuItem(tempItem));

      if (item.subs) {
        return item.subs.map((sub) => {
          const controlledSub = { ...sub, path: tempItem.path + sub.path };

          if (authGuardActive) {
            if (tempItem.protected) controlledSub.protected = true;

            if (tempItem.roles) {
              if (!sub.roles) controlledSub.roles = tempItem.roles;
              else {
                // common roles..
                controlledSub.roles = tempItem.roles.filter((x) => sub.roles.includes(x));

                if (controlledSub.roles && controlledSub.roles.length === 0) {
                  controlledSub.inaccessible = true;
                  console.log(
                    `This menu item(${controlledSub.path}) is inaccessible. Please check the roles you defined in the hierarchical structure.`,
                    controlledSub
                  );
                }
              }
            } else if (tempItem.publicOnly) {
              controlledSub.publicOnly = true;
            }
            if (controlledSub.roles && controlledSub.roles.length === 0) delete controlledSub.roles;

            if (!controlledSub.inaccessible) return itemMapper(controlledSub);
            return itemMapper({});
          }
          return itemMapper(controlledSub);
        });
      }
      return tempItem;
    };
    items.map(itemMapper);
    return menuItems;
  };
};

export const filterRoutesByPlans = (routesObj, activePlans = [], cashierType = 'qsr') => {
  const hasManager = activePlans.includes('Manager') || activePlans.length === 0;
  const hasQsr = activePlans.includes('QSR') || activePlans.length === 0;
  const hasKot = activePlans.includes('KOT Panel') || activePlans.length === 0;
  const hasStaff = activePlans.includes('Staff Management') || activePlans.length === 0;

  const qsrComponents = routesObj.qsrComponents || {};

  const mainMenuItems = (routesObj.mainMenuItems || [])
    .map((item) => {
      const newItem = { ...item };

      // Redirect filtering
      if (newItem.redirect && newItem.to && newItem.to.endsWith('/dashboard')) {
        const clonedItem = { ...newItem };
        const localAppRoot = DEFAULT_PATHS.APP.endsWith('/') ? DEFAULT_PATHS.APP.slice(1, DEFAULT_PATHS.APP.length) : DEFAULT_PATHS.APP;
        if (!hasManager && hasQsr) {
          clonedItem.to = `${localAppRoot}/dashboard/qsr`;
        } else if (hasManager && hasQsr) {
          // Both plans: redirect based on cashierType preference
          clonedItem.to = cashierType === 'dine-in' ? `${localAppRoot}/dashboard/manager` : `${localAppRoot}/dashboard/qsr`;
        } else {
          clonedItem.to = `${localAppRoot}/dashboard/manager`;
        }
        return clonedItem;
      }

      // 1. Dashboard filtering
      if (newItem.path && newItem.path.endsWith('/dashboard')) {
        const clonedItem = { ...newItem };
        const localAppRoot = DEFAULT_PATHS.APP.endsWith('/') ? DEFAULT_PATHS.APP.slice(1, DEFAULT_PATHS.APP.length) : DEFAULT_PATHS.APP;
        if (cashierType === 'dine-in') {
          // Only Manager dashboard for dine-in cashier
          delete clonedItem.subs;
          clonedItem.component = newItem.component;
          clonedItem.path = `${localAppRoot}/dashboard/manager`;
        } else if (cashierType === 'qsr') {
          // Only QSR dashboard for QSR cashier
          delete clonedItem.subs;
          clonedItem.component = qsrComponents.dashboard;
          clonedItem.path = `${localAppRoot}/dashboard/qsr`;
        } else if (hasManager && hasQsr) {
          // Both plans active — show both sub-items like manager panel
          clonedItem.subs = [
            { path: '/manager', label: 'Manager Dashboard', component: clonedItem.component },
            { path: '/qsr', label: 'QSR Dashboard', component: qsrComponents.dashboard },
          ];
          delete clonedItem.component;
        } else if (!hasQsr) {
          // Only Manager plan
          delete clonedItem.subs;
          clonedItem.component = newItem.component;
          clonedItem.path = `${localAppRoot}/dashboard/manager`;
        } else {
          // Only QSR plan
          delete clonedItem.subs;
          clonedItem.component = qsrComponents.dashboard;
          clonedItem.path = `${localAppRoot}/dashboard/qsr`;
        }
        return clonedItem;
      }

      // 2. Staff Management filter
      if (newItem.path && newItem.path.endsWith('/staff') && !hasStaff) {
        return null;
      }

      // 3. KOT Panel filter
      if (newItem.path && newItem.path.endsWith('/kot') && !hasKot) {
        return null;
      }

      // 4. POS Orders filter
      if (newItem.path && newItem.path.endsWith('/order')) {
        const clonedItem = { ...newItem };
        if (clonedItem.subs) {
          clonedItem.subs = clonedItem.subs
            .map((sub) => ({ ...sub }))
            .filter((sub) => {
              if (['/dine-in', '/takeaway', '/delivery'].includes(sub.path) && cashierType !== 'dine-in') {
                return false;
              }
              if (sub.path === '/qsr-pos' && cashierType !== 'qsr') {
                return false;
              }
              return true;
            });
        }
        if (!clonedItem.subs || clonedItem.subs.length === 0) return null;
        return clonedItem;
      }

      return newItem;
    })
    .filter(Boolean);

  return { ...routesObj, mainMenuItems };
};

export const getRoutes = ({ data, isLogin, userRole }) =>
  convertToRoutes({
    data,
    isLogin,
    userRole,
    authGuardActive: IS_AUTH_GUARD_ACTIVE,
    unauthorizedPath: DEFAULT_PATHS.UNAUTHORIZED,
    loginPath: DEFAULT_PATHS.LOGIN,
    invalidAccessPath: DEFAULT_PATHS.INVALID_ACCESS,
    noLayout: false,
  })();

export const getLayoutlessRoutes = ({ data }) => convertToRoutes({ data, noLayout: true })();
export const getMenuItems = ({ data, isLogin, userRole }) => convertToMenuItems({ data, isLogin, userRole, authGuardActive: IS_AUTH_GUARD_ACTIVE });

export const getSearchItems = ({ data, isLogin, userRole }) => convertToSearchItems({ data, isLogin, userRole, authGuardActive: IS_AUTH_GUARD_ACTIVE });
