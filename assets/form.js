/* I Am Jane Doe — share-your-story form
   Sends the story to the inbox through FormSubmit. */
(function () {
  'use strict';
  var ENDPOINT = 'https://formsubmit.co/ajax/iamjanedoestories@gmail.com';

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('story-form');
    if (!form) return;
    var story = form.querySelector('[name="story"]');
    var file = form.querySelector('[name="attachment"]');
    var fileLabel = form.querySelector('#file-label');
    var submit = form.querySelector('#submit-story');
    var errorEl = form.querySelector('#form-error');
    var thanks = document.getElementById('thanks');
    var thanksDetail = document.getElementById('thanks-detail');
    var email = form.querySelector('[name="email"]');
    var approveRow = document.getElementById('approve-row');
    var approve = form.querySelector('[name="approve"]');
    var approveHint = document.getElementById('approve-hint');
    var sending = false;

    function choice() {
      var c = form.querySelector('[name="sharing"]:checked');
      return c ? c.value : '';
    }
    function update() {
      var hasStory = story.value.trim() || (file.files && file.files.length);
      submit.disabled = sending || !hasStory || !choice();
      var hasEmail = email.value.trim().length > 0;
      approveRow.hidden = choice() !== 'share';
      approve.disabled = !hasEmail;
      approveHint.hidden = hasEmail;
    }
    file.addEventListener('change', function () {
      fileLabel.textContent = file.files && file.files[0] ? file.files[0].name : 'No file chosen';
      update();
    });
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    update();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;
      var share = choice() === 'share';
      var wantsApproval = share && !approve.disabled && approve.checked;
      var fd = new FormData(form);
      fd.delete('approve');

      // Send chosen topics as one readable line.
      var topics = fd.getAll('topic');
      fd.delete('topic');
      fd.set('topics', topics.length ? topics.join(', ') : '(none chosen)');
      fd.set('sharing', share
        ? 'YES: share anonymously in the story library'
        : 'NO: keep private, only for us to read');
      if (share) fd.set('approve first', wantsApproval
        ? 'YES: email her the edited version to approve before publishing'
        : 'No (no email given, or she did not ask)');
      fd.set('_subject', !share
        ? 'New story: keep private'
        : wantsApproval
          ? 'New story: OK to share (send her the edit to approve first)'
          : 'New story: OK to share in the library');

      sending = true; update();
      submit.textContent = 'Sending';
      errorEl.hidden = true;

      fetch(ENDPOINT, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
        .then(function (res) { if (!res.ok) throw new Error(); return res.json().catch(function () { return {}; }); })
        .then(function () {
          form.hidden = true;
          thanksDetail.textContent = !share
            ? 'We’ll read your story with care within a week. It will stay private and will never be published.'
            : wantsApproval
              ? 'We’ll read your story with care within a week, remove anything that could identify you, and email you the edited version. Nothing is published until you say it’s right.'
              : 'We’ll read your story with care within a week. Once anything that could identify you is removed, it will join the story library, where it can help another woman feel less alone.';
          thanks.hidden = false;
          thanks.focus();
        })
        .catch(function () {
          sending = false;
          submit.textContent = 'Share my story';
          errorEl.textContent = 'Your story didn’t send. Please try again in a moment.';
          errorEl.hidden = false;
          update();
        });
    });
  });
})();
