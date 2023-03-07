// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ConsoleLogger } from '@aws-amplify/core';

import {
	apnsMessage,
	apnsMessagePayload,
	fcmMessage,
	fcmMessageOptions,
	fcmMessagePayload,
	pushNotificationAdhocData,
	pushNotificationDeeplinkUrl,
	imageUrl,
	pushNotificationUrl,
} from '../../__mocks__/data';
import {
	normalizeNativeMessage,
	normalizeNativePermissionStatus,
} from '../../src/PushNotification/utils';
import { PushNotificationPermissionStatus } from '../../src/PushNotification/types';

jest.mock('@aws-amplify/core');

const loggerErrorSpy = jest.spyOn(ConsoleLogger.prototype, 'error');

describe('PushNotification Utils', () => {
	describe('normalizeNativeMessage', () => {
		describe('normalizes apns messages', () => {
			test('typical messages', () => {
				const { body, subtitle, title } = apnsMessagePayload.alert;
				expect(normalizeNativeMessage(apnsMessage)).toStrictEqual({
					title,
					body,
					imageUrl: imageUrl,
					data: {
						...pushNotificationAdhocData,
						'media-url': imageUrl,
					},
					apnsOptions: { subtitle },
				});
			});

			test('alert only messages', () => {
				const { body, title } = apnsMessagePayload.alert;
				const payload = { aps: { alert: { body, title } } };
				expect(normalizeNativeMessage(payload)).toStrictEqual({ body, title });
			});

			test('data only messages', () => {
				const payload = {
					aps: { 'content-available': 1 },
					data: pushNotificationAdhocData,
				};
				expect(normalizeNativeMessage(payload)).toStrictEqual({
					data: pushNotificationAdhocData,
				});
			});

			test('deep link action', () => {
				const payload = {
					aps: apnsMessagePayload,
					data: {
						pinpoint: {
							deeplink: pushNotificationDeeplinkUrl,
						},
					},
				};
				expect(normalizeNativeMessage(payload)).toMatchObject({
					deeplinkUrl: pushNotificationDeeplinkUrl,
				});
			});
		});

		describe('normalizes fcm messages', () => {
			test('typical messages', () => {
				const { body, rawData, imageUrl, title } = fcmMessagePayload;
				expect(normalizeNativeMessage(fcmMessage)).toStrictEqual({
					body,
					data: rawData,
					imageUrl,
					title,
					fcmOptions: {
						...fcmMessageOptions,
						sendTime: new Date(fcmMessageOptions.sendTime),
					},
				});
			});

			test('data only messages', () => {
				const { rawData } = fcmMessagePayload;
				const payload = { payload: JSON.stringify({ rawData }) };
				expect(normalizeNativeMessage(payload)).toStrictEqual({
					data: pushNotificationAdhocData,
				});
			});

			test('go to url action', () => {
				const payload = {
					payload: JSON.stringify({
						action: { 'pinpoint.url': pushNotificationUrl },
					}),
				};
				expect(normalizeNativeMessage(payload)).toMatchObject({
					goToUrl: pushNotificationUrl,
				});
			});

			test('deep link action', () => {
				const payload = {
					payload: JSON.stringify({
						action: { 'pinpoint.deeplink': pushNotificationDeeplinkUrl },
					}),
				};
				expect(normalizeNativeMessage(payload)).toMatchObject({
					deeplinkUrl: pushNotificationDeeplinkUrl,
				});
			});

			test('logs an error if the payload is not parseable', () => {
				jest.clearAllMocks();
				const payload = { payload: 'bad-payload' };
				normalizeNativeMessage(payload);
				expect(loggerErrorSpy).toBeCalledWith(
					expect.stringContaining('An error ocurred parsing')
				);
			});
		});

		test('handles null input', () => {
			expect(normalizeNativeMessage()).toBeNull();
		});
	});

	describe('normalizeNativePermissionStatus', () => {
		test('normalizes android statuses', () => {
			expect(normalizeNativePermissionStatus('NotRequested')).toBe(
				PushNotificationPermissionStatus.NOT_REQUESTED
			);
			expect(
				normalizeNativePermissionStatus('ShouldRequestWithRationale')
			).toBe(PushNotificationPermissionStatus.SHOULD_REQUEST_WITH_RATIONALE);
			expect(normalizeNativePermissionStatus('Granted')).toBe(
				PushNotificationPermissionStatus.GRANTED
			);
			expect(normalizeNativePermissionStatus('Denied')).toBe(
				PushNotificationPermissionStatus.DENIED
			);
		});

		test('normalizes ios statuses', () => {
			expect(normalizeNativePermissionStatus('NotDetermined')).toBe(
				PushNotificationPermissionStatus.SHOULD_REQUEST_WITH_RATIONALE
			);
			expect(normalizeNativePermissionStatus('Authorized')).toBe(
				PushNotificationPermissionStatus.GRANTED
			);
			expect(normalizeNativePermissionStatus('Denied')).toBe(
				PushNotificationPermissionStatus.DENIED
			);
		});
	});
});
