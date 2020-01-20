import DeprecatedModel from './DeprecatedModel';

/**
* Implements a live notification.
*/
class LiveNotification extends DeprecatedModel {

  get definition() {
    return {
      created: 0,
      from_uid: 0,
      id: 0,
      invitation_id: 0,
      invitation_secret: '',
      notification_key: '',
      notification_type: '',
      seq_no: 0,
      state: ''
    };
  }

}

export default LiveNotification;

/*
{
    "created": 1377639720,
    "from_uid": 123,
    "id": 1,
    "invitation_id": 456,
    "invitation_secret": "abcdefghijklmno",
    "notification_key": "notification_123",
    "notification_type": "share_invitation_sent",
    "seq_no": 12345567890,
    "state": "accepted"
}

{
    "created": 1377639720,
    "from_uid": 123,
    "id": 2,
    "invitation_id": 456,
    "notification_key": "notification_123",
    "notification_type": "share_invitation_accepted",
    "project_id": 789,
    "legacy_project_id": 567,
    "seq_no": 1234567890
}

{
    "created": 1377639720,
    "from_uid": 123,
    "id": 3,
    "invitation_id": 456,
    "notification_key": "notification_123",
    "notification_type": "share_invitation_rejected",
    "project_id": 789,
    "legacy_project_id": 567,
    "reject_email": "me@example.com",
    "seq_no": 1234567890
}

{
    "created": 1377639720,
    "from_uid": 123,
    "id": 4,
    "notification_key": "notification_123",
    "notification_type": "user_left_project",
    "project_id": 456,
    "legacy_project_id": 567,
    "seq_no": 1234567890
}

{
    "created": 1377639720,
    "from_uid": 123,
    "id": 5,
    "notification_key": "notification_123",
    "notification_type": "user_removed_from_project",
    "project_id": 567,
    "legacy_project_id": 456,
    "removed_name": "Example User",
    "removed_uid": 789,
    "seq_no": 1234567890
}

{
    "assigned_by_uid": 789,
    "created": 1377639720,
    "from_uid": 123,
    "id": 6,
    "item_content": "NewTask",
    "item_id": 789,
    "legacy_item_id": 456,
    "notification_key": "notification_123",
    "notification_type": "item_assigned",
    "project_id": 567,
    "legacy_project_id": 789,
    "responsible_uid": 321,
    "seq_no": 1234567890
}

{
    "assigned_by_uid": 789,
    "created": 1377639720,
    "from_uid": 123,
    "id": 7,
    "item_content": "NewTask",
    "item_id": 789,
    "legacy_item_id": 456,
    "notification_key": "notification_123",
    "notification_type": "item_completed",
    "project_id": 567,
    "legacy_project_id": 789,
    "responsible_uid": 321,
    "seq_no": 1234567890
}

{
    "assigned_by_uid": 789,
    "created": 1377639720,
    "from_uid": 123,
    "id": 8,
    "item": 456,
    "item_content": "NewTask",
    "notification_key": "notification_123",
    "notification_type": "item_uncompleted",
    "project": 789,
    "responsible_uid": 321,
    "seq_no": 1234567890
}

{
    "created": 1377639720,
    "from_uid": 123,
    "id": 9,
    "item_id": 789,
    "legacy_item_id": 456,
    "note_content": "NewTask",
    "note_id": 321,
    "legacy_note_id": 789,
    "notification_key": "notification_123",
    "notification_type": "note_added",
    "project_id": 221,
    "legacy_project_id": 321,
    "seq_no": 1234567890
}

{
    "created": 1377639720,
    "email": "me@example.com",
    "from_uid": 123,
    "id": 10,
    "notification_key": "notification_123",
    "notification_type": "biz_policy_disallowed_invitation",
    "project_id": 543,
    "legacy_project_id": 456,
    "seq_no": 1234567890,
    "from_user": {
        "email": "you@example.com",
        "full_name": "Example User",
        "id": "789",
        "image_id": "321"
    }
}

{
    "created": 1377639720,
    "from_uid": 123,
    "id": 11,
    "inviter_id": 456,
    "notification_key": "notification_123",
    "notification_type": "biz_policy_rejected_invitation",
    "seq_no": 1234567890,
    "from_user": {
        "email": "you@example.com",
        "full_name": "Example User",
        "id": "789",
        "image_id": "321"
    }
}

{
    "active_until": 1399299727,
    "created": 1377639720,
    "from_uid": 123,
    "id": 12,
    "notification_key": "notification_123",
    "notification_type": "biz_trial_will_end",
    "plan": "business_monthly",
    "quantity": 10,
    "seq_no": 1234567890
}

{
    "active_until": 1399299727,
    "amount_due": 600,
    "attempt_count": 1,
    "created": 1377639720,
    "currency": "usd",
    "description": "2 x Subscription to Monthly ($3.00/month)",
    "from_uid": 123,
    "id": 13,
    "next_payment_attempt": 1399299735,
    "notification_key": "notification_123",
    "notification_type": "biz_payment_failed",
    "plan": "business_monthly",
    "quantity": 10,
    "seq_no": 1234567890
}

{
    "active_until": 1399299727,
    "created": 1377639720,
    "from_uid": 123,
    "id": 14,
    "notification_key": "notification_123",
    "notification_type": "biz_account_disabled",
    "plan": "business_monthly",
    "quantity": 10,
    "seq_no": 1234567890
}

{
    "account_name": "Example Inc.",
    "created": 1377639720,
    "from_uid": 123,
    "from_user": {
        "email": "you@example.com",
        "full_name": "Example User",
        "id": "456",
        "image_id": "789"
    },
    "id": 15,
    "invitation_id": 321,
    "invitation_message": "Welcome to our team!",
    "invitation_secret": "abcdefghijklmno",
    "notification_key": "notification_123",
    "notification_type": "biz_invitation_created",
    "seq_no": 1234567890,
    "state": "accepted"
}

{
    "created": 1377639720,
    "from_uid": 123,
    "from_user": {
        "account_name": "Example Inc.",
        "email": "you@example.com",
        "full_name": "Example User",
        "id": "456",
        "image_id": "789"
    },
    "id": 16,
    "invitation_id": 321,
    "notification_key": "notification_123",
    "notification_type": "biz_invitation_accepted",
    "seq_no": 1234567890
}

{
    "created": 1377639720,
    "from_uid": 123,
    "from_user": {
        "account_name": "Example Inc.",
        "email": "you@example.com",
        "full_name": "Example User",
        "id": "456",
        "image_id": "789"
    },
    "id": 17,
    "invitation_id": 321,
    "notification_key": "notification_123",
    "notification_type": "biz_invitation_rejected",
    "seq_no": 1234567890
}
 */
