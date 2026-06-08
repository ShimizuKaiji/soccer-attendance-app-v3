import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  remove,
  onValue
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB5SBEkXWPGLKOob_g7-8vkhGmM3I-PRHA",
  authDomain: "soccer-attendance-app-e07f5.firebaseapp.com",
  databaseURL: "https://soccer-attendance-app-e07f5-default-rtdb.firebaseio.com",
  projectId: "soccer-attendance-app-e07f5",
  storageBucket: "soccer-attendance-app-e07f5.firebasestorage.app",
  messagingSenderId: "733928390",
  appId: "1:733928390:web:1dc259ac01916249cab0c7"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const dateInput = document.getElementById("dateInput");
const activityInput = document.getElementById("activityInput");
const nameInput = document.getElementById("nameInput");
const statusInput = document.getElementById("statusInput");
const commentInput = document.getElementById("commentInput");
const addButton = document.getElementById("addButton");
const attendanceList = document.getElementById("attendanceList");
const listTitle = document.getElementById("listTitle");

const presentCount = document.getElementById("presentCount");
const absentCount = document.getElementById("absentCount");
const lateCount = document.getElementById("lateCount");

let unsubscribe = null;

// 今日の日付を初期値にする
const today = new Date().toISOString().split("T")[0];
dateInput.value = today;

// 日付ごとの保存場所を作る
function getAttendanceRef() {
  const selectedDate = dateInput.value;
  return ref(db, `attendance_v3/${selectedDate}`);
}

// 一覧タイトルを更新する
function updateListTitle() {
  const selectedDate = dateInput.value;
  const activity = activityInput.value.trim();

  if (activity === "") {
    listTitle.textContent = `${selectedDate} の出欠一覧`;
  } else {
    listTitle.textContent = `${selectedDate}（${activity}）の出欠一覧`;
  }
}

// 登録ボタンを押したとき
addButton.addEventListener("click", async () => {
  const selectedDate = dateInput.value;
  const activity = activityInput.value.trim();
  const name = nameInput.value.trim();
  const status = statusInput.value;
  const comment = commentInput.value.trim();

  if (selectedDate === "") {
    alert("日付を選択してください");
    return;
  }

  if (activity === "") {
    alert("活動内容を入力してください");
    return;
  }

  if (name === "") {
    alert("名前を入力してください");
    return;
  }

  const newData = {
    date: selectedDate,
    activity: activity,
    name: name,
    status: status,
    comment: comment,
    createdAt: Date.now()
  };

  try {
    await push(getAttendanceRef(), newData);

    nameInput.value = "";
    statusInput.value = "出席";
    commentInput.value = "";
  } catch (error) {
    console.error("登録エラー:", error);
    alert("登録に失敗しました");
  }
});

// 選択した日付のデータだけ読み込む
function subscribeAttendance() {
  if (unsubscribe) {
    unsubscribe();
  }

  updateListTitle();

  const attendanceRef = getAttendanceRef();

  unsubscribe = onValue(attendanceRef, (snapshot) => {
    const data = snapshot.val();

    attendanceList.innerHTML = "";

    const attendanceData = [];

    if (data) {
      const entries = Object.entries(data);

      entries.sort((a, b) => b[1].createdAt - a[1].createdAt);

      entries.forEach(([id, item]) => {
        attendanceData.push(item);

        const li = document.createElement("li");

        li.innerHTML = `
          <div class="item-top">
            <div>
              <strong>${item.name}</strong>
              <span class="status">：${item.status}</span>
            </div>
            <button class="delete-btn" data-id="${id}">削除</button>
          </div>
          <div class="comment">
            活動：${item.activity || "未入力"}<br>
            コメント：${item.comment || "コメントなし"}
          </div>
        `;

        attendanceList.appendChild(li);
      });
    }

    updateCount(attendanceData);
  });
}

// 出席・欠席・遅刻の人数を数える
function updateCount(attendanceData) {
  presentCount.textContent = attendanceData.filter(item => item.status === "出席").length;
  absentCount.textContent = attendanceData.filter(item => item.status === "欠席").length;
  lateCount.textContent = attendanceData.filter(item => item.status === "遅刻").length;
}

// 削除ボタンを押したとき
attendanceList.addEventListener("click", async (event) => {
  if (event.target.classList.contains("delete-btn")) {
    const id = event.target.dataset.id;

    try {
      await remove(ref(db, `attendance_v3/${dateInput.value}/${id}`));
    } catch (error) {
      console.error("削除エラー:", error);
      alert("削除に失敗しました");
    }
  }
});

// 日付や活動内容を変えたら表示も変える
dateInput.addEventListener("change", subscribeAttendance);
activityInput.addEventListener("input", updateListTitle);

// 最初に今日の出欠を表示
subscribeAttendance();