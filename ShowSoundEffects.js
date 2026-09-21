import System;
import System.IO;
import System.Drawing;
import System.Windows.Forms;
import Sony.Vegas;


// =========================================================
// 전역 변수
// =========================================================

var soundEffectsForm = null;
var soundEffectsListView = null;
var soundEffectsStatusLabel = null;

var refreshTimer = null;

// 현재 RefreshSoundEffects()가 실행 중인지
var isRefreshing = false;

// Timer가 갱신을 요청했는지
var refreshPending = false;


// =========================================================
// Sound Effects 목록 갱신
// =========================================================

function RefreshSoundEffects()
{
    // 이미 갱신 중이면 중복 실행하지 않음
    if (isRefreshing)
    {
        refreshPending = true;
        return;
    }

    if (soundEffectsListView == null)
        return;

    isRefreshing = true;
    refreshPending = false;

    try
    {
        // =================================================
        // 1. 효과음 정보 수집
        // =================================================

        var soundEffects = [];

        for (var track : Track in Vegas.Project.Tracks)
        {
            if (!track.IsAudio())
                continue;

            for (var evnt : TrackEvent in track.Events)
            {
                if (!evnt.IsAudio())
                    continue;

                var take = evnt.ActiveTake;

                if (take == null)
                    continue;

                if (!take.IsValid())
                    continue;

                var filePath = take.MediaPath;

                if (filePath == null || filePath == "")
                    continue;

                var effect = new Object();

                effect.Start = evnt.Start;
                effect.StartTicks = evnt.Start.ToMilliseconds();
                effect.TrackName = track.Name;
                effect.FileName = Path.GetFileName(filePath);

                soundEffects.push(effect);
            }
        }


        // =================================================
        // 2. 시작 시간 기준 정렬
        // =================================================

        soundEffects.sort(
            function(a, b)
            {
                if (a.StartTicks < b.StartTicks)
                    return -1;

                if (a.StartTicks > b.StartTicks)
                    return 1;

                return 0;
            }
        );


        // =================================================
        // 3. ListView 갱신
        // =================================================

        soundEffectsListView.BeginUpdate();

        soundEffectsListView.Items.Clear();

        for (var i = 0; i < soundEffects.length; i++)
        {
            var effect = soundEffects[i];

            var item = new ListViewItem(
                effect.Start.ToString()
            );

            item.SubItems.Add(
                effect.TrackName
            );

            item.SubItems.Add(
                effect.FileName
            );

            // 나중에 선택했을 때 사용할 정보
            item.Tag = effect.FileName;

            soundEffectsListView.Items.Add(item);
        }


        // =================================================
        // 4. Total
        // =================================================

        if (soundEffectsStatusLabel != null)
        {
            soundEffectsStatusLabel.Text =
                "Total: " + soundEffects.length;
        }
    }
    catch (e)
    {
        // Vegas 프로젝트가 변경되는 순간에는
        // 객체 접근이 일시적으로 실패할 수 있음.
    }
    finally
    {
        soundEffectsListView.EndUpdate();

        isRefreshing = false;
    }


    // =====================================================
    // 갱신 중 새로운 요청이 들어온 경우
    // =====================================================

    if (refreshPending)
    {
        refreshPending = false;

        RefreshSoundEffects();
    }
}


// =========================================================
// Timer Tick
// =========================================================

function OnRefreshTimerTick(sender, args)
{
    // 이미 갱신 중이면 이번 Tick은 무시
    if (isRefreshing)
    {
        refreshPending = true;
        return;
    }

    RefreshSoundEffects();
}


// =========================================================
// Timer 시작
// =========================================================

function StartRefreshTimer()
{
    if (refreshTimer != null)
        return;


    refreshTimer = new System.Windows.Forms.Timer();

    // 500ms마다 확인
    refreshTimer.Interval = 500;

    refreshTimer.Tick += OnRefreshTimerTick;

    refreshTimer.Start();
}


// =========================================================
// Timer 종료
// =========================================================

function StopRefreshTimer()
{
    if (refreshTimer == null)
        return;


    try
    {
        refreshTimer.Stop();

        refreshTimer.Tick -= OnRefreshTimerTick;

        refreshTimer.Dispose();
    }
    catch (e)
    {
    }


    refreshTimer = null;
}


// =========================================================
// Form 생성
// =========================================================

function ShowSoundEffects()
{
    // -----------------------------------------------------
    // 이미 창이 열려 있으면 기존 창 활성화
    // -----------------------------------------------------

    if (soundEffectsForm != null)
    {
        try
        {
            soundEffectsForm.Activate();
            return;
        }
        catch (e)
        {
            soundEffectsForm = null;
        }
    }


    // -----------------------------------------------------
    // Form
    // -----------------------------------------------------

    soundEffectsForm = new Form();

    soundEffectsForm.Text = "Sound Effects";

    soundEffectsForm.Width = 600;
    soundEffectsForm.Height = 500;

    soundEffectsForm.StartPosition =
        FormStartPosition.CenterScreen;


    // =====================================================
    // 제목
    // =====================================================

    var titleLabel = new Label();

    titleLabel.Text = "Sound Effects in Project";

    titleLabel.Dock = DockStyle.Top;
    titleLabel.Height = 35;

    titleLabel.Font =
        new System.Drawing.Font(
            "Arial",
            12,
            System.Drawing.FontStyle.Bold
        );

    titleLabel.TextAlign =
        ContentAlignment.MiddleLeft;

    titleLabel.Padding =
        new Padding(10, 0, 0, 0);

    soundEffectsForm.Controls.Add(titleLabel);


    // =====================================================
    // ListView
    // =====================================================

    soundEffectsListView = new ListView();

    soundEffectsListView.Dock = DockStyle.Fill;

    soundEffectsListView.View =
        View.Details;

    soundEffectsListView.FullRowSelect =
        true;

    soundEffectsListView.GridLines =
        true;


    // Columns

    soundEffectsListView.Columns.Add(
        "Time",
        120
    );

    soundEffectsListView.Columns.Add(
        "Track",
        150
    );

    soundEffectsListView.Columns.Add(
        "File",
        280
    );


    soundEffectsForm.Controls.Add(
        soundEffectsListView
    );

    soundEffectsListView.SelectedIndexChanged +=
        function(sender, args)
        {
            if (soundEffectsListView.SelectedItems.Count == 0)
            {
                ClearSoundEffectHighlight();
                return;
            }

            var selectedItem =
                soundEffectsListView.SelectedItems[0];

            HighlightSameSoundEffects(
                selectedItem
            );
        };


    // =====================================================
    // Status Label
    // =====================================================

    soundEffectsStatusLabel = new Label();

    soundEffectsStatusLabel.Text =
        "Total: 0";

    soundEffectsStatusLabel.Dock =
        DockStyle.Bottom;

    soundEffectsStatusLabel.Height =
        30;

    soundEffectsStatusLabel.TextAlign =
        ContentAlignment.MiddleRight;

    soundEffectsStatusLabel.Padding =
        new Padding(0, 0, 10, 0);

    soundEffectsForm.Controls.Add(
        soundEffectsStatusLabel
    );


    // =====================================================
    // Form 종료 처리
    // =====================================================

    soundEffectsForm.FormClosed +=
        function(sender, args)
        {
            // Timer 종료
            StopRefreshTimer();


            // 객체 정리
            soundEffectsListView = null;

            soundEffectsStatusLabel = null;

            soundEffectsForm = null;

            isRefreshing = false;

            refreshPending = false;
        };


    // =====================================================
    // 최초 목록 생성
    // =====================================================

    RefreshSoundEffects();


    // =====================================================
    // Timer 시작
    // =====================================================

    StartRefreshTimer();


    // =====================================================
    // Form 표시
    // =====================================================

    soundEffectsForm.Show();
}

// =========================================================
// 동일한 이름의 사운드 효과 강조
// =========================================================

function HighlightSameSoundEffects(selectedItem)
{
    if (soundEffectsListView == null)
        return;

    if (selectedItem == null)
        return;

    var selectedFileName =
        selectedItem.Tag;

    if (selectedFileName == null)
        return;


    // 기존 강조 제거
    ClearSoundEffectHighlight();


    // 같은 파일명을 가진 항목 강조
    for (var i = 0;
         i < soundEffectsListView.Items.Count;
         i++)
    {
        var item =
            soundEffectsListView.Items[i];

        if (item.Tag == selectedFileName)
        {
            item.BackColor =
                System.Drawing.Color.LightBlue;

            item.ForeColor =
                System.Drawing.Color.Black;
        }
    }
}

// =========================================================
// 강조표시 삭제
// =========================================================

function ClearSoundEffectHighlight()
{
    if (soundEffectsListView == null)
        return;

    for (var i = 0;
         i < soundEffectsListView.Items.Count;
         i++)
    {
        var item =
            soundEffectsListView.Items[i];

        item.BackColor =
            System.Drawing.SystemColors.Window;

        item.ForeColor =
            System.Drawing.SystemColors.WindowText;
    }
}


// =========================================================
// Script 실행
// =========================================================

try
{
    ShowSoundEffects();
}
catch (e)
{
    MessageBox.Show(
        e.toString(),
        "Show Sound Effects - Error"
    );
}