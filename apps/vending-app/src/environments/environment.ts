/**
 ************************************************************************
 * Copyright (C) 2026 Clarivex Technologies Private Limited
 * All Rights Reserved.
 *
 * NOTICE: All intellectual and technical concepts contained
 * herein are proprietary to Clarivex Technologies Private Limited
 * and may be covered by Indian and Foreign Patents,
 * patents in process, and are protected by trade secret or
 * copyright law. Dissemination of this information or reproduction
 * of this material is strictly forbidden unless prior written
 * permission is obtained from Clarivex Technologies Private Limited.
 *
 * Product:   Pervaxis Platform
 * Website:   https://clarivex.tech
 ************************************************************************
 */

export const environment = {
  production: false,
  apiUrl: 'http://localhost:5081',
  cognito: {
    region: 'us-east-1',
    userPoolId: 'us-east-1_FJU1dsYdU',
    domain: 'https://us-east-1fju1dsydu.auth.us-east-1.amazoncognito.com',
    clientId: '3g9i1vqvvdbrcb7v2s3cgchsdj',
    scopes: ['openid', 'email', 'phone'],
  },
};
