<?php
include 'database.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'];

    if ($action === 'add_group') {
        $groupName = $_POST['group_name'];
        $sql = "INSERT INTO groups (group_name) VALUES ('$groupName')";
        $result = $conn->query($sql);
        echo $result ? "Group added successfully" : "Error: " . $conn->error;
    }

    if ($action === 'add_calendar_event') {
        $date = $_POST['date'];
        $description = $_POST['description'];
        $sql = "INSERT INTO calendar (date, description) VALUES ('$date', '$description')";
        $result = $conn->query($sql);
        echo $result ? "Event added successfully" : "Error: " . $conn->error;
    }
}
?>
